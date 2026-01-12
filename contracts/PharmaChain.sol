// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title PharmaChain
 * @author Senior Solidity Architect
 * @notice Enterprise-grade upgradeable pharmaceutical supply chain management system
 * @dev Implements UUPS proxy pattern with role-based access control
 * 
 * Key Security Features:
 * - UUPS upgradeable pattern for future enhancements
 * - Role-based access control (MANUFACTURER, DISTRIBUTOR, PHARMACY)
 * - Custom errors for gas optimization
 * - Storage gap for upgrade safety
 * - Two-step transfer to prevent "Transfer Limbo"
 * - Ghost batch prevention through quantity validation
 * - Emergency recall mechanism
 */
contract PharmaChain is 
    Initializable, 
    UUPSUpgradeable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // ============ Role Definitions ============
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    // ============ Custom Errors (Gas Saving) ============
    error InvalidState();
    error Unauthorized();
    error InvalidQuantity();
    error InsufficientQuantity();
    error BatchNotFound();
    error InvalidTransfer();
    error BatchLocked();
    error BatchAlreadyRecalled();
    error InvalidBatchId();
    error NotBatchOwner();
    error SelfTransferNotAllowed();

    // ============ Enums ============
    enum Status {
        CREATED,      // Batch created
        IN_TRANSIT,   // Batch is being transferred
        DELIVERED,    // Batch delivered to recipient
        RECALLED      // Batch recalled (frozen state)
    }

    // ============ Structs ============
    struct Batch {
        uint256 id;
        uint256 parentBatchId;      // 0 if root batch
        uint256 quantity;
        string unit;                // e.g., "vials", "boxes"
        address currentOwner;
        address manufacturer;       // Original creator (immutable)
        Status status;
        address pendingRecipient;   // For two-step transfer
        uint256 createdAt;
        uint256 lastUpdated;
    }

    // ============ State Variables ============
    // ============ State Variables ============
    uint256 internal _batchIdCounter;
    
    // Mapping from batch ID to Batch struct
    mapping(uint256 => Batch) internal _batches;
    
    // Mapping to track all batch IDs (for enumeration if needed)
    uint256[] internal _allBatchIds;
    
    // Mapping from owner address to their batch IDs
    mapping(address => uint256[]) internal _ownerBatches;

    // ============ Events (Crucial for History) ============
    event BatchCreated(
        uint256 indexed batchId,
        address indexed manufacturer,
        uint256 quantity,
        string unit
    );

    event BatchSplit(
        uint256 indexed parentBatchId,
        uint256 indexed childBatchId,
        uint256 amount,
        address indexed owner
    );

    event TransferInitiated(
        uint256 indexed batchId,
        address indexed from,
        address indexed to
    );

    event Transfer(
        uint256 indexed batchId,
        address indexed from,
        address indexed to
    );

    event StatusUpdate(
        uint256 indexed batchId,
        Status status
    );

    event MetadataAdded(
        uint256 indexed batchId,
        string ipfsHash,
        string docType,
        address indexed addedBy
    );

    event BatchRecalled(
        uint256 indexed batchId,
        address indexed recalledBy,
        string reason
    );

    // ============ Modifiers ============
    modifier onlyBatchOwner(uint256 batchId) {
        if (_batches[batchId].currentOwner != msg.sender) {
            revert NotBatchOwner();
        }
        _;
    }

    modifier batchExists(uint256 batchId) {
        if (_batches[batchId].id == 0) {
            revert BatchNotFound();
        }
        _;
    }

    modifier notRecalled(uint256 batchId) {
        if (_batches[batchId].status == Status.RECALLED) {
            revert BatchAlreadyRecalled();
        }
        _;
    }

    modifier notInTransit(uint256 batchId) {
        if (_batches[batchId].status == Status.IN_TRANSIT) {
            revert BatchLocked();
        }
        _;
    }

    // ============ Initialization ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract (replaces constructor for upgradeable contracts)
     * @param admin Address to be granted DEFAULT_ADMIN_ROLE
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        // Grant admin role to the deployer
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        
        // Start batch IDs from 1 (0 is reserved for "no parent")
        _batchIdCounter = 1;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new root batch (only manufacturers)
     * @param quantity Amount of product
     * @param unit Unit of measurement (e.g., "vials", "boxes")
     * @return batchId The ID of the newly created batch
     * 
     * @dev Gas Saving: Uses custom error instead of require string
     * @dev Anti-Collision: Validates quantity > 0 to prevent ghost batches
     */
    function createBatch(
        uint256 quantity,
        string memory unit
    ) public onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        // Anti-Ghost Batch: Prevent creating empty batches
        if (quantity == 0) {
            revert InvalidQuantity();
        }

        uint256 newBatchId = _batchIdCounter++;

        Batch storage batch = _batches[newBatchId];
        batch.id = newBatchId;
        batch.parentBatchId = 0; // Root batch
        batch.quantity = quantity;
        batch.unit = unit;
        batch.currentOwner = msg.sender;
        batch.manufacturer = msg.sender;
        batch.status = Status.CREATED;
        batch.createdAt = block.timestamp;
        batch.lastUpdated = block.timestamp;

        _allBatchIds.push(newBatchId);
        _ownerBatches[msg.sender].push(newBatchId);

        emit BatchCreated(newBatchId, msg.sender, quantity, unit);
        emit StatusUpdate(newBatchId, Status.CREATED);

        return newBatchId;
    }

    /**
     * @notice Split a batch into a child batch
     * @param parentBatchId The batch to split from
     * @param quantity Amount to split into new batch
     * @return childBatchId The ID of the newly created child batch
     * 
     * @dev Anti-Collision: Prevents splitting from IN_TRANSIT or RECALLED batches
     * @dev Anti-Ghost Batch: Validates quantity > 0 and sufficient parent quantity
     */
    function splitBatch(
        uint256 parentBatchId,
        uint256 quantity
    ) 
        public 
        batchExists(parentBatchId)
        onlyBatchOwner(parentBatchId)
        notRecalled(parentBatchId)
        notInTransit(parentBatchId)
        nonReentrant
        returns (uint256) 
    {
        Batch storage parentBatch = _batches[parentBatchId];

        // Anti-Ghost Batch: Prevent creating empty child batches
        if (quantity == 0) {
            revert InvalidQuantity();
        }

        // Ensure parent has sufficient quantity
        if (parentBatch.quantity < quantity) {
            revert InsufficientQuantity();
        }

        // Deduct from parent
        parentBatch.quantity -= quantity;
        parentBatch.lastUpdated = block.timestamp;

        // Create child batch
        uint256 childBatchId = _batchIdCounter++;

        Batch storage childBatch = _batches[childBatchId];
        childBatch.id = childBatchId;
        childBatch.parentBatchId = parentBatchId;
        childBatch.quantity = quantity;
        childBatch.unit = parentBatch.unit;
        childBatch.currentOwner = msg.sender;
        childBatch.manufacturer = parentBatch.manufacturer; // Preserve original manufacturer
        childBatch.status = Status.CREATED;
        childBatch.createdAt = block.timestamp;
        childBatch.lastUpdated = block.timestamp;

        _allBatchIds.push(childBatchId);
        _ownerBatches[msg.sender].push(childBatchId);

        emit BatchSplit(parentBatchId, childBatchId, quantity, msg.sender);
        emit StatusUpdate(childBatchId, Status.CREATED);

        return childBatchId;
    }

    /**
     * @notice Initiate a two-step transfer (Step 1)
     * @param batchId The batch to transfer
     * @param recipient The intended recipient
     * 
     * @dev Anti-Transfer Limbo: Locks batch in IN_TRANSIT state until accepted
     */
    function initiateTransfer(
        uint256 batchId,
        address recipient
    ) 
        public 
        batchExists(batchId)
        onlyBatchOwner(batchId)
        notRecalled(batchId)
        notInTransit(batchId)
    {
        if (recipient == address(0) || recipient == msg.sender) {
            revert SelfTransferNotAllowed();
        }

        Batch storage batch = _batches[batchId];
        batch.pendingRecipient = recipient;
        batch.status = Status.IN_TRANSIT;
        batch.lastUpdated = block.timestamp;

        emit TransferInitiated(batchId, msg.sender, recipient);
        emit StatusUpdate(batchId, Status.IN_TRANSIT);
    }

    /**
     * @notice Accept a pending transfer (Step 2)
     * @param batchId The batch to accept
     * 
     * @dev Anti-Transfer Limbo: Completes transfer and unlocks batch
     * @dev Anti-Collision: Validates caller is the pending recipient
     */
    function acceptTransfer(uint256 batchId) 
        public 
        batchExists(batchId)
        notRecalled(batchId)
        nonReentrant
    {
        Batch storage batch = _batches[batchId];

        // Validate transfer state
        if (batch.status != Status.IN_TRANSIT) {
            revert InvalidState();
        }

        if (batch.pendingRecipient != msg.sender) {
            revert Unauthorized();
        }

        address previousOwner = batch.currentOwner;

        // Complete transfer
        batch.currentOwner = msg.sender;
        batch.pendingRecipient = address(0);
        batch.status = Status.DELIVERED;
        batch.lastUpdated = block.timestamp;

        // Update ownership tracking
        _ownerBatches[msg.sender].push(batchId);

        emit Transfer(batchId, previousOwner, msg.sender);
        emit StatusUpdate(batchId, Status.DELIVERED);
    }

    /**
     * @notice Cancel a pending transfer (only by initiator)
     * @param batchId The batch transfer to cancel
     */
    function cancelTransfer(uint256 batchId) 
        public 
        batchExists(batchId)
        onlyBatchOwner(batchId)
    {
        Batch storage batch = _batches[batchId];

        if (batch.status != Status.IN_TRANSIT) {
            revert InvalidState();
        }

        batch.pendingRecipient = address(0);
        batch.status = Status.DELIVERED; // Return to previous state
        batch.lastUpdated = block.timestamp;

        emit StatusUpdate(batchId, Status.DELIVERED);
    }

    /**
     * @notice Emergency recall of a batch
     * @param batchId The batch to recall
     * @param reason Reason for recall
     * 
     * @dev Only original manufacturer or admin can recall
     * @dev Once recalled, batch is permanently frozen
     */
    function recallBatch(
        uint256 batchId,
        string calldata reason
    ) 
        public 
        batchExists(batchId)
    {
        Batch storage batch = _batches[batchId];

        // Only manufacturer or admin can recall
        if (batch.manufacturer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        // Prevent recalling already recalled batches
        if (batch.status == Status.RECALLED) {
            revert BatchAlreadyRecalled();
        }

        batch.status = Status.RECALLED;
        batch.lastUpdated = block.timestamp;

        emit BatchRecalled(batchId, msg.sender, reason);
        emit StatusUpdate(batchId, Status.RECALLED);
    }

    /**
     * @notice Create a batch with metadata in one transaction
     * @param quantity Amount of product
     * @param unit Unit of measurement (e.g., "vials", "boxes")
     * @param ipfsHash IPFS hash of the metadata
     * @return batchId The ID of the newly created batch
     * 
     * @dev Convenience function that combines createBatch and addMetadata
     */
    function createBatchWithMetadata(
        uint256 quantity,
        string memory unit,
        string memory ipfsHash
    ) public virtual onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        // Create the batch
        uint256 batchId = createBatch(quantity, unit);
        
        // Add metadata
        emit MetadataAdded(batchId, ipfsHash, "batch_metadata", msg.sender);
        
        return batchId;
    }

    /**
     * @notice Add metadata to a batch (e.g., IPFS hash for documents)
     * @param batchId The batch to add metadata to
     * @param ipfsHash IPFS hash of the document
     * @param docType Type of document (e.g., "certificate", "test_results")
     * 
     * @dev Gas Saving: Does not store hash on-chain, only emits event
     * @dev Metadata is tracked off-chain via events
     */
    function addMetadata(
        uint256 batchId,
        string memory ipfsHash,
        string memory docType
    ) 
        public 
        batchExists(batchId)
        onlyBatchOwner(batchId)
        notRecalled(batchId)
        notInTransit(batchId)
    {
        // Gas Saving: Emit event instead of storing on-chain
        // Off-chain indexers can track metadata via events
        emit MetadataAdded(batchId, ipfsHash, docType, msg.sender);

        // Update timestamp
        _batches[batchId].lastUpdated = block.timestamp;
    }

    // ============ View Functions ============

    /**
     * @notice Get batch details
     * @param batchId The batch ID to query
     * @return Batch struct with all details
     */
    function getBatch(uint256 batchId) 
        public 
        view 
        batchExists(batchId)
        returns (Batch memory) 
    {
        return _batches[batchId];
    }

    /**
     * @notice Get all batch IDs owned by an address
     * @param owner The owner address
     * @return Array of batch IDs
     */
    function getBatchesByOwner(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _ownerBatches[owner];
    }

    /**
     * @notice Get total number of batches created
     * @return Total batch count
     */
    function getTotalBatches() external view returns (uint256) {
        return _allBatchIds.length;
    }

    /**
     * @notice Get all batch IDs
     * @return Array of all batch IDs
     */
    function getAllBatchIds() external view returns (uint256[] memory) {
        return _allBatchIds;
    }

    /**
     * @notice Check if a batch is in a transferable state
     * @param batchId The batch ID to check
     * @return True if batch can be transferred
     */
    function isTransferable(uint256 batchId) 
        external 
        view 
        batchExists(batchId)
        returns (bool) 
    {
        Batch storage batch = _batches[batchId];
        return batch.status != Status.IN_TRANSIT && batch.status != Status.RECALLED;
    }

    // ============ Admin Functions ============

    /**
     * @notice Grant manufacturer role
     * @param account Address to grant role to
     */
    function grantManufacturerRole(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(MANUFACTURER_ROLE, account);
    }

    /**
     * @notice Grant distributor role
     * @param account Address to grant role to
     */
    function grantDistributorRole(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(DISTRIBUTOR_ROLE, account);
    }

    /**
     * @notice Grant pharmacy role
     * @param account Address to grant role to
     */
    function grantPharmacyRole(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(PHARMACY_ROLE, account);
    }

    // ============ Upgrade Authorization ============

    /**
     * @notice Authorize contract upgrades (UUPS requirement)
     * @param newImplementation Address of new implementation
     * @dev Only admin can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        // Anti-Collision: Additional upgrade validation can be added here
        // For example, checking implementation version compatibility
    }

    // ============ Storage Gap (Upgrade Safety) ============
    /**
     * @dev Storage gap for future upgrades
     * This reserves storage slots to prevent storage collisions when adding new state variables
     * Current storage: ~10 slots used
     * Reserved: 50 slots for future use
     */
    uint256[50] private __gap;
}
