
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/trace';

async function verifySearch() {
  console.log('\n--- Verifying Traceability Search ---\n');

  try {
    // 1. Search by Batch Number (using a known ID if possible, or we loop to find one first)
    // First, let's get *any* batch to know what to search for.
    // Assuming /api/batches/recent or similar exists, or we might fail if DB empty.
    // But I can try a "Product" search first which is broader.
    
    // We'll search for "Cough" or "Pain" commonly used, or just "A" to find something.
    console.log('1. Searching for "a"...');
    const fuzzyRes = await axios.get(`${API_URL}/search?q=a`).catch(e => e.response);
    
    if (fuzzyRes.status === 404) {
        console.log('No batches found with "a". DB might be empty.');
        return;
    }
    
    if (fuzzyRes.status !== 200) {
        console.error('Fuzzy search failed:', fuzzyRes.data || fuzzyRes.statusText);
        return;
    }

    console.log(`Found ${fuzzyRes.data.count || 1} candidates.`); // Adjust if it returned full trace for 1 result
    
    let targetBatch;
    
    if (fuzzyRes.data.candidates) {
        targetBatch = fuzzyRes.data.candidates[0];
    } else if (fuzzyRes.data.batch) {
         // It returned a full trace
         targetBatch = fuzzyRes.data.batch;
    }

    if (!targetBatch) {
        console.log("No candidates to test exact search.");
        return;
    }

    const batchNumber = targetBatch.batchNumber;
    console.log(`\nSelected Batch Number: ${batchNumber}`);

    // 2. Exact Search
    console.log(`2. Exact search for batch number: ${batchNumber}...`);
    const exactRes = await axios.get(`${API_URL}/search?q=${batchNumber}`);
    
    if (exactRes.status === 200 && exactRes.data.batch && exactRes.data.batch.batchNumber === batchNumber) {
        console.log('SUCCESS: Exact search returned full trace for batch.');
    } else {
        console.error('FAILURE: Exact search did not return expected trace.', exactRes.data);
    }
    
    // 3. 404 Check
    console.log('\n3. Testing non-existent batch...');
    const failRes = await axios.get(`${API_URL}/search?q=NON_EXISTENT_BATCH_99999`).catch(e => e.response);
    if (failRes.status === 404) {
        console.log('SUCCESS: Correctly returned 404 for missing batch.');
    } else {
        console.error(`FAILURE: Expected 404, got ${failRes.status}`);
    }

  } catch (error) {
    console.error('Test failed with exception:', error.message);
  }
}

verifySearch();
