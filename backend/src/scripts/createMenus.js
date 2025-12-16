import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from '../models/Menu.js';
import { connectToDatabase } from '../config/db.js';

dotenv.config();

const menusData = [
  {
    name: 'Event Services',
    description: 'All event-related services',
    submenus: [
      'Tent Booking',
      'DJ Booking',
      'Cameraman / Photographer',
      'Videographer',
      'Event Management',
      'Stage Setup Booking',
      'Sound System Booking',
      'Lighting Setup Booking',
      'Generator Booking',
      'Decoration Services',
      'Catering Services',
      'Band Baja Booking',
      'Dhol / Tasha Group',
      'Shehnai Group',
      'Wedding Planner',
      'Mehndi Artist',
      'Makeup Artist',
      'Costume & Dress Rental',
      'Event Furniture Rental',
      'Bouncy / Kids Game Setup',
      'Crockery & Utensils Rental',
      'Car Rental for Wedding',
      'Flower Vendor Booking',
      'Balloon Decorator',
      'Sweet Shop Orders',
      'Ice Cream Counter',
      'Juice Counter Booking',
      'Live Food Stall Booking'
    ]
  },
  {
    name: 'Venue & Hall Bookings',
    description: 'Venue and hall booking services',
    submenus: [
      'Party Hall Booking',
      'Community Hall Booking',
      'Marriage Garden Booking',
      'Banquet Hall Booking',
      'Farmhouse Booking',
      'Resort Booking',
      'Open Ground/Plot for Events',
      'Corporate Event Space'
    ]
  },
  {
    name: 'Stay & Hospitality Bookings',
    description: 'Stay and hospitality services',
    submenus: [
      'Hotel Room Booking',
      'Lodge / Guest House Booking',
      'Resort Stay Booking',
      'Homestay Booking',
      'Farmhouse Stay'
    ]
  },
  {
    name: 'Property & Rental Bookings',
    description: 'Property and rental booking services',
    submenus: [
      'Flat Booking',
      'Rent House Booking',
      'PG / Hostel Booking',
      'Shop Booking',
      'Warehouse/Godown Booking',
      'Office Space Booking',
      'Jameen/Plot Booking',
      'Commercial Property Booking'
    ]
  },
  {
    name: 'Utility & Manpower Services',
    description: 'Utility and manpower services',
    submenus: [
      'Catering Helpers',
      'Cook / Chef Booking',
      'Driver Booking',
      'Cleaner / Sweeper Booking',
      'Security Guard Booking',
      'Water Tanker Booking',
      'Printing & Flex Banner Booking',
      'Courier / Delivery Partner Booking',
      'Electrician (Event-related)',
      'Plumber (Event-related)',
      'Carpenter (Event setup-related)',
      'Auto/Taxi Booking',
      'Tempo Traveller Booking',
      'Bus Booking',
      'Truck / Mini-Tempo Booking'
    ]
  },
  {
    name: 'Cultural & Religious Services',
    description: 'Cultural and religious services',
    submenus: [
      'Pandit Ji / Purohit Booking',
      'Astrologer Booking'
    ]
  }
];

async function createMenus() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Clear existing menus (optional - comment out if you want to keep existing)
    // await Menu.deleteMany({});
    // console.log('Cleared existing menus');

    let createdMenus = 0;
    let createdSubmenus = 0;

    for (const menuData of menusData) {
      // Check if main menu already exists
      let mainMenu = await Menu.findOne({ 
        name: menuData.name,
        parentMenuId: null
      });

      if (!mainMenu) {
        // Create main menu
        mainMenu = new Menu({
          name: menuData.name,
          description: menuData.description,
          icon: '',
          image: '',
          parentMenuId: null,
          isActive: true,
          sortOrder: createdMenus
        });
        await mainMenu.save();
        createdMenus++;
        console.log(`✅ Created main menu: ${menuData.name}`);
      } else {
        console.log(`ℹ️  Main menu already exists: ${menuData.name}`);
      }

      // Create submenus
      for (let i = 0; i < menuData.submenus.length; i++) {
        const submenuName = menuData.submenus[i];
        
        // Check if submenu already exists
        const existingSubmenu = await Menu.findOne({
          name: submenuName,
          parentMenuId: mainMenu._id
        });

        if (!existingSubmenu) {
          const submenu = new Menu({
            name: submenuName,
            description: '',
            icon: '',
            image: '',
            parentMenuId: mainMenu._id,
            isActive: true,
            sortOrder: i
          });
          await submenu.save();
          createdSubmenus++;
          console.log(`  ✅ Created submenu: ${submenuName}`);
        } else {
          console.log(`  ℹ️  Submenu already exists: ${submenuName}`);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Main menus: ${createdMenus} created`);
    console.log(`   Submenus: ${createdSubmenus} created`);
    console.log('\n✅ All menus created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating menus:', error);
    process.exit(1);
  }
}

createMenus();




