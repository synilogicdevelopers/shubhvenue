import axios from 'axios';

// Simple script to approve vendor - requires admin access
// Or manually update in database: db.users.updateOne({email: "testvendor@example.com"}, {$set: {vendorStatus: "approved", verified: true}})

console.log('💡 To approve the test vendor, you can:');
console.log('');
console.log('Option 1: Use MongoDB directly');
console.log('  db.users.updateOne(');
console.log('    {email: "testvendor@example.com"},');
console.log('    {$set: {vendorStatus: "approved", verified: true}}');
console.log('  )');
console.log('');
console.log('Option 2: Use Admin Panel');
console.log('  - Login as admin');
console.log('  - Go to Vendors section');
console.log('  - Approve the test vendor');
console.log('');
console.log('Option 3: Temporarily disable approval check for testing');
console.log('  - Modify backend/src/controllers/vendor.venues.controller.js');
console.log('  - Comment out the vendorStatus check temporarily');


