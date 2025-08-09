const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkUserDiscount() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    // Check if discountPercentage column exists
    console.log('\n=== CHECKING DISCOUNT COLUMN ===');
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'discountPercentage'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ discountPercentage sütunu mövcud deyil!');
      
      // Add the column
      console.log('🔧 discountPercentage sütunu əlavə edirəm...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "discountPercentage" INTEGER DEFAULT 0
      `);
      console.log('✅ discountPercentage sütunu əlavə edildi!');
    } else {
      console.log('✅ discountPercentage sütunu mövcuddur:');
      console.log(`  ${columnCheck.rows[0].column_name}: ${columnCheck.rows[0].data_type} (${columnCheck.rows[0].is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    }

    // Get a sample user
    console.log('\n=== SAMPLE USER DATA ===');
    const sampleUser = await client.query(`
      SELECT id, email, "firstName", "lastName", "discountPercentage"
      FROM users 
      LIMIT 1
    `);
    
    if (sampleUser.rows.length > 0) {
      const user = sampleUser.rows[0];
      console.log('Sample user:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Current discount: ${user.discountPercentage || 0}%`);
      
      // Test updating discount
      console.log('\n=== TESTING DISCOUNT UPDATE ===');
      const newDiscount = 15;
      console.log(`Setting discount to ${newDiscount}%...`);
      
      const updateResult = await client.query(`
        UPDATE users 
        SET "discountPercentage" = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING id, email, "firstName", "lastName", "discountPercentage"
      `, [newDiscount, user.id]);
      
      if (updateResult.rows.length > 0) {
        const updatedUser = updateResult.rows[0];
        console.log('✅ Discount updated successfully!');
        console.log(`  New discount: ${updatedUser.discountPercentage}%`);
        
        // Verify the update
        const verifyResult = await client.query(`
          SELECT "discountPercentage" FROM users WHERE id = $1
        `, [user.id]);
        
        console.log(`  Verified discount: ${verifyResult.rows[0].discountPercentage}%`);
      } else {
        console.log('❌ Discount update failed!');
      }
    } else {
      console.log('❌ No users found in database');
    }

    // Show all users with their discounts
    console.log('\n=== ALL USERS WITH DISCOUNTS ===');
    const allUsers = await client.query(`
      SELECT id, email, "firstName", "lastName", "discountPercentage"
      FROM users 
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log('Users and their discounts:');
    allUsers.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}): ${user.discountPercentage || 0}%`);
    });

    console.log('\n✅ User discount check completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkUserDiscount();
