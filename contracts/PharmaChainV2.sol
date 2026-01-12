// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PharmaChain.sol";

/**
 * @title PharmaChainV2
 * @author Senior Solidity Architect
 * @notice Enhanced version with identity verification and improved metadata handling
 * @dev Extends PharmaChain V1 with new features while maintaining upgrade safety
 * 
 * New Features in V2:
 * - Identity verification system for participants
 * - Enhanced metadata handling with IPFS hash support
 * - Participant registration with identity hashes
 * - Admin-controlled identity updates
 * 
 * Storage Layout:
 * - Inherits all V1 storage
 * - Adds identity verification mapping
 * - Maintains storage gap for future upgrades
 */
contract PharmaChainV2 is PharmaChain {
    // ============ V2 Storage Variables ============
    
    /**
     * @notice Mapping to store identity hashes for verified participants
     * @dev Stores keccak256 hash of off-chain PII (Personal Identifiable Information)
     * The actual PII should be stored off-chain with only the hash on-chain
     */
    mapping(address => bytes32) public identityHashes;
    
    /**
     * @notice Mapping to track if a participant is registered
     * @dev Used to differentiate between unregistered (bytes32(0)) and registered participants
     */
    mapping(address => bool) public isRegistered;

    // ============ V2 Events ============
    
    /**
     * @notice Emitted when a new participant is registered
     * @param participant Address of the registered participant
     * @param role Role assigned to the participant
     * @param identityHash Hash of the participant's identity information
     */
    event ParticipantRegistered(
        address indexed participant,
        bytes32 indexed role,
        bytes32 identityHash
    );

    /**
     * @notice Emitted when a participant's identity hash is updated
     * @param participant Address of the participant
     * @param oldHash Previous identity hash
     * @param newHash New identity hash
     */
    event IdentityHashUpdated(
        address indexed participant,
        bytes32 oldHash,
        bytes32 newHash
    );

    /**
     * @notice Emitted when metadata is added to a batch
     * @param batchId ID of the batch
     * @param ipfsHash IPFS hash pointing to metadata JSON
     * @param addedBy Address that added the metadata
     */
    event MetadataAdded(
        uint256 indexed batchId,
        string ipfsHash,
        address indexed addedBy
    );

    /**
     * @notice Emitted when multiple batches are created in bulk
     * @param firstBatchId ID of the first batch created in the bulk operation
     * @param count Total number of batches created
     * @param manufacturer Address of the manufacturer who created the batches
     * @param manufacturerBatchNumbers Array of manufacturer's internal batch numbers for indexing
     */
    event BulkBatchCreated(
        uint256 indexed firstBatchId,
        uint256 count,
        address indexed manufacturer,
        string[] manufacturerBatchNumbers
    );

    /**
     * @notice Emitted when a batch is split and transferred (Partial Send)
     * @param parentBatchId ID of the source batch
     * @param newBatchId ID of the newly created batch
     * @param from Sender address
     * @param to Recipient address
     * @param quantity Amount transferred
     */
    event BatchTransfer(
        uint256 indexed parentBatchId,
        uint256 newBatchId,
        address indexed from,
        address indexed to,
        uint256 quantity
    );

    // ============ V2 Custom Errors ============
    
    error ParticipantNotRegistered();
    error ParticipantAlreadyRegistered();
    error InvalidIdentityHash();
    error InvalidRole();
    error InvalidIPFSHash();
    error ArrayLengthMismatch();
    error BatchLimitExceeded();
    error EmptyArray();

    // ============ V2 Functions ============

    /**
     * @notice Register a new participant with identity verification
     * @dev Only admin can register participants. Identity hash should be keccak256 of off-chain PII
     * @param user Address of the participant to register
     * @param role Role to assign (MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, or PHARMACY_ROLE)
     * @param identityHash keccak256 hash of the participant's identity information
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     * - User must not be already registered
     * - Identity hash must not be zero
     * - Role must be valid
     * 
     * Emits: ParticipantRegistered event
     */
    function registerParticipant(
        address user,
        bytes32 role,
        bytes32 identityHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isRegistered[user]) revert ParticipantAlreadyRegistered();
        if (identityHash == bytes32(0)) revert InvalidIdentityHash();
        if (
            role != MANUFACTURER_ROLE &&
            role != DISTRIBUTOR_ROLE &&
            role != PHARMACY_ROLE
        ) revert InvalidRole();

        // Store identity hash
        identityHashes[user] = identityHash;
        isRegistered[user] = true;

        // Grant role
        _grantRole(role, user);

        emit ParticipantRegistered(user, role, identityHash);
    }

    /**
     * @notice Update a participant's identity hash
     * @dev Only admin can update identity hashes. Used when participant's PII changes
     * @param user Address of the participant
     * @param newHash New keccak256 hash of updated identity information
     * 
     * Requirements:
     * - Caller must have DEFAULT_ADMIN_ROLE
     * - User must be registered
     * - New hash must not be zero
     * 
     * Emits: IdentityHashUpdated event
     */
    function updateParticipantHash(
        address user,
        bytes32 newHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!isRegistered[user]) revert ParticipantNotRegistered();
        if (newHash == bytes32(0)) revert InvalidIdentityHash();

        bytes32 oldHash = identityHashes[user];
        identityHashes[user] = newHash;

        emit IdentityHashUpdated(user, oldHash, newHash);
    }

    /**
     * @notice Transfer a specific quantity of a batch to a recipient (Split & Send)
     * @dev Combines split logic with immediate transfer ownership
     * @param parentBatchId The batch to split from
     * @param recipient The receiver of the new partial batch
     * @param quantity The amount to transfer
     * @return newBatchId The ID of the newly created batch
     */
    function sendBatch(
        uint256 parentBatchId,
        address recipient,
        uint256 quantity
    ) 
        external 
        batchExists(parentBatchId)
        onlyBatchOwner(parentBatchId)
        notRecalled(parentBatchId)
        notInTransit(parentBatchId)
        nonReentrant
        returns (uint256)
    {
        if (recipient == address(0) || recipient == msg.sender) revert InvalidTransfer();
        
        Batch storage parentBatch = _batches[parentBatchId];
        
        // Validation calls custom errors from V1
        if (quantity == 0) revert InvalidQuantity();
        if (parentBatch.quantity < quantity) revert InsufficientQuantity();

        // 1. Deduct from parent
        parentBatch.quantity -= quantity;
        parentBatch.lastUpdated = block.timestamp;

        // 2. Create new batch
        uint256 newBatchId = _batchIdCounter++;
        
        Batch storage newBatch = _batches[newBatchId];
        newBatch.id = newBatchId;
        newBatch.parentBatchId = parentBatchId;
        newBatch.quantity = quantity;
        newBatch.unit = parentBatch.unit;
        newBatch.currentOwner = recipient; // Assign directly to recipient
        newBatch.manufacturer = parentBatch.manufacturer;
        newBatch.status = Status.CREATED; // Active state
        newBatch.createdAt = block.timestamp;
        newBatch.lastUpdated = block.timestamp;

        // 3. Track ownership
        _allBatchIds.push(newBatchId);
        _ownerBatches[recipient].push(newBatchId);

        // 4. Events
        emit BatchSplit(parentBatchId, newBatchId, quantity, msg.sender);
        emit BatchTransfer(parentBatchId, newBatchId, msg.sender, recipient, quantity);

        return newBatchId;
    }

    /**
     * @notice Enhanced batch creation with IPFS metadata support
     * @dev Creates a new batch with metadata stored on IPFS
     * @param quantity Amount of product in the batch
     * @param unit Unit of measurement (e.g., "vials", "boxes")
     * @param ipfsMetadataHash IPFS hash pointing to JSON metadata file
     * 
     * The IPFS metadata JSON should contain:
     * {
     *   "productName": "Product Name",
     *   "expiryDate": "2025-12-31",
     *   "documents": [
     *     {
     *       "type": "Quality Certificate",
     *       "ipfsHash": "Qm..."
     *     },
     *     {
     *       "type": "Lab Report",
     *       "ipfsHash": "Qm..."
     *     }
     *   ]
     * }
     * 
     * Requirements:
     * - Caller must have MANUFACTURER_ROLE
     * - Quantity must be greater than 0
     * - IPFS hash must not be empty
     * 
     * Returns: batchId of the created batch
     * Emits: BatchCreated and MetadataAdded events
     */
    function createBatchWithMetadata(
        uint256 quantity,
        string memory unit,
        string memory ipfsMetadataHash
    ) public override onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        if (bytes(ipfsMetadataHash).length == 0) revert InvalidIPFSHash();

        // Create batch using V1 function
        uint256 batchId = createBatch(quantity, unit);

        // Emit metadata event
        emit MetadataAdded(batchId, ipfsMetadataHash, msg.sender);

        return batchId;
    }

    /**
     * @notice Add or update metadata for an existing batch
     * @dev Allows batch owner to add/update IPFS metadata
     * @param batchId ID of the batch
     * @param ipfsMetadataHash IPFS hash pointing to metadata JSON
     * 
     * Requirements:
     * - Batch must exist
     * - Caller must be the batch owner
     * - IPFS hash must not be empty
     * 
     * Emits: MetadataAdded event
     */
    function addMetadata(
        uint256 batchId,
        string memory ipfsMetadataHash
    ) external {
        if (bytes(ipfsMetadataHash).length == 0) revert InvalidIPFSHash();
        
        // Get batch to verify ownership
        Batch memory batch = getBatch(batchId);
        if (batch.currentOwner != msg.sender) revert NotBatchOwner();

        emit MetadataAdded(batchId, ipfsMetadataHash, msg.sender);
    }

    /**
     * @notice Get participant's identity verification status
     * @param participant Address to check
     * @return registered Whether the participant is registered
     * @return identityHash The participant's identity hash (bytes32(0) if not registered)
     */
    function getParticipantInfo(address participant)
        external
        view
        returns (bool registered, bytes32 identityHash)
    {
        return (isRegistered[participant], identityHashes[participant]);
    }

    /**
     * @notice Verify if a participant's identity matches a given hash
     * @dev Useful for off-chain verification systems
     * @param participant Address to verify
     * @param claimedHash Hash to verify against
     * @return matches Whether the hashes match
     */
    function verifyIdentity(address participant, bytes32 claimedHash)
        external
        view
        returns (bool matches)
    {
        return isRegistered[participant] && identityHashes[participant] == claimedHash;
    }

    /**
     * @notice Get the version of the contract
     * @return version string
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    /**
     * @notice Create multiple batches in a single transaction (Bulk Import)
     * @dev Only accessible to manufacturers. Critical for ERP system synchronization via CSV upload.
     * 
     * @param quantities Array of inventory counts for each batch
     * @param units Array of unit of measure for each batch (e.g., "Box", "Vial")
     * @param ipfsHashes Array of IPFS hashes linking to off-chain metadata (JSON)
     * @param manufacturerBatchNumbers Array of manufacturer's internal batch IDs (e.g., "BN-101")
     * 
     * Gas Optimization Strategy:
     * - Uses calldata for read-only array parameters (most gas-efficient)
     * - Uses unchecked increment for loop counter (safe in Solidity 0.8+)
     * - Does NOT store manufacturerBatchNumbers on-chain (emits in event for indexing)
     * - Emits individual events for each batch (backward compatibility)
     * - Emits summary event for bulk operation (efficient off-chain indexing)
     * 
     * Validation:
     * - All four arrays must have identical length
     * - Maximum 50 batches per transaction (prevents block gas limit issues)
     * - No batch can have zero quantity
     * - IPFS hashes must not be empty
     * 
     * Requirements:
     * - Caller must have MANUFACTURER_ROLE
     * - Arrays must not be empty
     * - All validation checks must pass
     * 
     * Returns: firstBatchId - The ID of the first batch created
     * 
     * Emits: 
     * - BatchCreated event for each batch (for existing listeners)
     * - MetadataAdded event for each batch (for existing listeners)
     * - BulkBatchCreated summary event (for bulk operation tracking)
     * 
     * Example Usage:
     * createBatchesBulk(
     *   [1000, 2000, 1500],
     *   ["Box", "Box", "Vial"],
     *   ["QmHash1...", "QmHash2...", "QmHash3..."],
     *   ["BN-101", "BN-102", "BN-103"]
     * )
     */
    function createBatchesBulk(
        uint256[] calldata quantities,
        string[] calldata units,
        string[] calldata ipfsHashes,
        string[] calldata manufacturerBatchNumbers
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256 firstBatchId) {
        // Validation: Check array lengths
        uint256 batchCount = quantities.length;
        
        if (batchCount == 0) revert EmptyArray();
        if (units.length != batchCount) revert ArrayLengthMismatch();
        if (ipfsHashes.length != batchCount) revert ArrayLengthMismatch();
        if (manufacturerBatchNumbers.length != batchCount) revert ArrayLengthMismatch();
        
        // Limits: Enforce maximum batch count to prevent gas limit issues
        if (batchCount > 50) revert BatchLimitExceeded();
        
        // Store the first batch ID for return value and event
        firstBatchId = _batchIdCounter;
        
        // Loop through arrays and create each batch
        for (uint256 i = 0; i < batchCount;) {
            // Zero Check: Ensure no batch has zero quantity
            if (quantities[i] == 0) revert InvalidQuantity();
            
            // Validate IPFS hash is not empty
            if (bytes(ipfsHashes[i]).length == 0) revert InvalidIPFSHash();
            
            // Storage: Create batch in contract state (use _batchIdCounter directly)
            Batch storage batch = _batches[_batchIdCounter];
            batch.id = _batchIdCounter;
            batch.parentBatchId = 0; // Root batch
            batch.quantity = quantities[i];
            batch.unit = units[i];
            batch.currentOwner = msg.sender;
            batch.manufacturer = msg.sender;
            batch.status = Status.CREATED;
            batch.createdAt = block.timestamp;
            batch.lastUpdated = block.timestamp;
            
            // Update tracking arrays
            _allBatchIds.push(_batchIdCounter);
            _ownerBatches[msg.sender].push(_batchIdCounter);
            
            // Individual Events: Emit standard events for backward compatibility
            emit BatchCreated(_batchIdCounter, msg.sender, quantities[i], units[i]);
            emit StatusUpdate(_batchIdCounter, Status.CREATED);
            emit MetadataAdded(_batchIdCounter, ipfsHashes[i], msg.sender);
            
            // Increment batch counter
            ++_batchIdCounter;
            
            // Gas Optimization: Unchecked increment (safe because we limit to 50)
            unchecked {
                ++i;
            }
        }
        
        // Summary Event: Emit bulk event with manufacturer batch numbers for indexing
        // Note: manufacturerBatchNumbers are NOT stored on-chain to save gas
        emit BulkBatchCreated(
            firstBatchId,
            batchCount,
            msg.sender,
            manufacturerBatchNumbers
        );
        
        return firstBatchId;
    }

    // ============ Storage Gap ============
    
    /**
     * @dev Storage gap to allow for new variables in future upgrades
     * Reduced from 50 to account for new storage variables:
     * - identityHashes mapping (1 slot)
     * - isRegistered mapping (1 slot)
     * Total new slots: 2
     * Remaining gap: 48
     */
    uint256[48] private __gapV2;
}
