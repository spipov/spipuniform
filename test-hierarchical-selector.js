// Test script for hierarchical school selector
async function testHierarchicalSelector() {
  console.log('Testing hierarchical school selector APIs...');

  try {
    // Test counties API
    console.log('\n1. Testing counties API...');
    const countiesResponse = await fetch('http://localhost:3350/api/counties');
    const countiesData = await countiesResponse.json();
    console.log('Counties:', countiesData);

    if (!countiesData.success) {
      throw new Error('Failed to fetch counties');
    }

    if (countiesData.counties.length === 0) {
      console.log('No counties found - this might be expected if database is empty');
    } else {
      console.log(`Found ${countiesData.counties.length} counties`);
    }

    // Test schools API
    console.log('\n2. Testing schools API...');
    const schoolsResponse = await fetch('http://localhost:3350/api/spipuniform/schools?schoolSetup=true');
    const schoolsData = await schoolsResponse.json();
    console.log('Schools:', schoolsData);

    if (!schoolsData.success) {
      throw new Error('Failed to fetch schools');
    }

    console.log(`Found ${schoolsData.schools.length} schools`);

    // Test localities API
    console.log('\n3. Testing localities API...');
    if (countiesData.counties.length > 0) {
      const firstCountyId = countiesData.counties[0].id;
      const localitiesResponse = await fetch(`http://localhost:3350/api/localities/${firstCountyId}`);
      const localitiesData = await localitiesResponse.json();
      console.log('Localities:', localitiesData);

      if (!localitiesData.success) {
        throw new Error('Failed to fetch localities');
      }

      console.log(`Found ${localitiesData.localities.length} localities for county ${firstCountyId}`);
    }

    console.log('\n✅ All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHierarchicalSelector();