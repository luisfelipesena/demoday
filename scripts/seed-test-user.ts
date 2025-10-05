import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { users, projects, demodays, projectSubmissions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

async function createTestUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // Test database connection
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');

    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create ADMIN user
    console.log('\n👨‍💼 Creating ADMIN test user...');
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@test.com'))
      .limit(1);

    let adminId: string;
    if (adminUser.length === 0) {
      const [newAdmin] = await db
        .insert(users)
        .values({
          name: 'Admin Test',
          email: 'admin@test.com',
          emailVerified: true,
          role: 'admin',
        })
        .returning();

      adminId = newAdmin.id;
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@test.com');
      console.log('👤 User ID:', newAdmin.id);
    } else {
      adminId = adminUser[0].id;
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@test.com');
    }

    // Create PROFESSOR user
    console.log('\n👨‍🏫 Creating PROFESSOR test user...');
    const professorUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'professor@test.com'))
      .limit(1);

    let professorId: string;
    if (professorUser.length === 0) {
      const [newProfessor] = await db
        .insert(users)
        .values({
          name: 'Professor Test',
          email: 'professor@test.com',
          emailVerified: true,
          role: 'professor',
        })
        .returning();

      professorId = newProfessor.id;
      console.log('✅ Professor user created successfully!');
      console.log('📧 Email: professor@test.com');
      console.log('👤 User ID:', newProfessor.id);
    } else {
      professorId = professorUser[0].id;
      console.log('✅ Professor user already exists');
      console.log('📧 Email: professor@test.com');
    }

    // Create STUDENT UFBA user
    console.log('\n👨‍🎓 Creating STUDENT UFBA test user...');
    const studentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'student@test.com'))
      .limit(1);

    let studentId: string;
    if (studentUser.length === 0) {
      const [newStudent] = await db
        .insert(users)
        .values({
          name: 'Student Test',
          email: 'student@test.com',
          emailVerified: true,
          role: 'student_ufba',
        })
        .returning();

      studentId = newStudent.id;
      console.log('✅ Student UFBA user created successfully!');
      console.log('📧 Email: student@test.com');
      console.log('👤 User ID:', newStudent.id);
    } else {
      studentId = studentUser[0].id;
      console.log('✅ Student UFBA user already exists');
      console.log('📧 Email: student@test.com');
    }

    // Create EXTERNAL STUDENT user
    console.log('\n👨‍🎓 Creating EXTERNAL STUDENT test user...');
    const externalUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'external@test.com'))
      .limit(1);

    if (externalUser.length === 0) {
      const [newExternal] = await db
        .insert(users)
        .values({
          name: 'External Student',
          email: 'external@test.com',
          emailVerified: true,
          role: 'student_external',
        })
        .returning();

      console.log('✅ External student user created successfully!');
      console.log('📧 Email: external@test.com');
      console.log('👤 User ID:', newExternal.id);
    } else {
      console.log('✅ External student user already exists');
      console.log('📧 Email: external@test.com');
    }

    // Create test e2e user for authentication tests
    console.log('\n🤖 Creating E2E test user...');
    const e2eUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'e2e-test@example.com'))
      .limit(1);

    if (e2eUser.length === 0) {
      await db.insert(users).values({
        name: 'E2E Test User',
        email: 'e2e-test@example.com',
        emailVerified: true,
        role: 'student_ufba',
      });
      console.log('✅ E2E test user created');
      console.log('📧 Email: e2e-test@example.com');
    } else {
      console.log('✅ E2E test user already exists');
    }

    // Create test Demoday if it doesn't exist
    console.log('\n🎯 Creating test Demoday...');
    const existingDemoday = await db
      .select()
      .from(demodays)
      .where(eq(demodays.name, 'Demoday Test E2E'))
      .limit(1);

    let demodayId: string;
    if (existingDemoday.length === 0) {
      const [newDemoday] = await db
        .insert(demodays)
        .values({
          name: 'Demoday Test E2E',
          createdById: adminId,
          active: true,
          status: 'active',
          maxFinalists: 5,
        })
        .returning();

      demodayId = newDemoday.id;
      console.log('✅ Test Demoday created');
      console.log('🏆 Demoday ID:', demodayId);
    } else {
      demodayId = existingDemoday[0].id;
      console.log('✅ Test Demoday already exists');
    }

    // Create test project for the student
    console.log('\n📦 Creating test project...');
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.title, 'Test Project E2E'))
      .limit(1);

    if (existingProject.length === 0) {
      const [newProject] = await db
        .insert(projects)
        .values({
          title: 'Test Project E2E',
          description: 'This is a test project for E2E testing',
          userId: studentId,
          type: 'TCC',
          videoUrl: 'https://youtube.com/watch?v=test',
          repositoryUrl: 'https://github.com/test/repo',
          developmentYear: '2024',
          authors: 'Student Test',
          contactEmail: 'student@test.com',
          contactPhone: '71999999999',
          advisorName: 'Professor Test',
        })
        .returning();

      // Submit the project to the demoday
      await db.insert(projectSubmissions).values({
        projectId: newProject.id,
        demoday_id: demodayId,
        status: 'submitted',
      });

      console.log('✅ Test project created and submitted');
      console.log('📚 Project ID:', newProject.id);
    } else {
      console.log('✅ Test project already exists');
    }

    console.log('\n✨ All test users and data created successfully!');
    console.log('\n📋 Summary:');
    console.log('  Admin: admin@test.com / password123 (Better Auth)');
    console.log('  Professor: professor@test.com / password123 (Better Auth)');
    console.log('  Student UFBA: student@test.com / password123 (Better Auth)');
    console.log('  External Student: external@test.com / password123 (Better Auth)');
    console.log('  E2E Test User: e2e-test@example.com / password123 (Better Auth)');
    console.log('  Test Demoday: Demoday Test E2E');
    console.log('  Test Project: Test Project E2E');
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'ECONNREFUSED') {
      console.error(
        '❌ Cannot connect to database. Make sure PostgreSQL is running and DATABASE_URL is correct.'
      );
    } else if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
      console.error('❌ Database table does not exist. Run migrations first: npm run db:push');
    } else {
      console.error('❌ Error creating test users:', err.message || String(error));
    }
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUsers().catch((error) => {
    console.error('Failed to create test users:', error);
    process.exit(1);
  });
}

export { createTestUsers };