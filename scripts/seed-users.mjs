import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Seeding database with default users...\n');

  // Default users to create
  const defaultUsers = [
    {
      email: 'admin@brightstart.edu',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    },
    {
      email: 'teacher@brightstart.edu',
      password: 'Teacher123!',
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'TEACHER'
    },
    {
      email: 'student@brightstart.edu',
      password: 'Student123!',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: 'USER'
    }
  ];

  for (const user of defaultUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        console.log(`✓ User ${user.email} already exists`);
        continue;
      }

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email: user.email,
            password: user.password, // Warning: In production, use bcrypt or similar
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(`✗ Failed to create ${user.email}:`, error.message);
        continue;
      }

      console.log(`✓ Created ${user.role} user: ${user.email}`);
      console.log(`  Username: ${user.firstName} ${user.lastName}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    } catch (err) {
      console.error(`✗ Error processing ${user.email}:`, err);
    }
  }

  console.log('🎉 Database seeding complete!\n');
  console.log('Login credentials:');
  for (const user of defaultUsers) {
    console.log(`  ${user.role === 'ADMIN' ? '👨‍💼 Admin' : user.role === 'TEACHER' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}: ${user.email} / ${user.password}`);
  }
}

seedDatabase().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
