const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const sql = `
ALTER TABLE \`university\`
  ADD COLUMN \`type\` ENUM('PUBLIC','PRIVATE','CHARTERED','FAITH_BASED','OTHER') NOT NULL DEFAULT 'PUBLIC' AFTER \`code\`,
  ADD COLUMN \`established_date\` datetime(3) NULL AFTER \`type\`,
  ADD COLUMN \`accreditation_body\` varchar(191) NULL AFTER \`established_date\`,
  ADD COLUMN \`accreditation_status\` varchar(191) NULL AFTER \`accreditation_body\`,
  ADD COLUMN \`accreditation_expiry\` datetime(3) NULL AFTER \`accreditation_status\`,
  ADD COLUMN \`timezone\` varchar(191) NOT NULL DEFAULT 'UTC' AFTER \`website\`,
  ADD COLUMN \`locale\` varchar(191) NOT NULL DEFAULT 'en' AFTER \`timezone\`,
  ADD COLUMN \`currency\` varchar(191) NOT NULL DEFAULT 'USD' AFTER \`locale\`,
  ADD COLUMN \`logo_url\` varchar(191) NULL AFTER \`currency\`,
  ADD COLUMN \`favicon_url\` varchar(191) NULL AFTER \`logo_url\`,
  ADD COLUMN \`primary_color\` varchar(191) NULL AFTER \`favicon_url\`,
  ADD COLUMN \`secondary_color\` varchar(191) NULL AFTER \`primary_color\`,
  ADD COLUMN \`contact_person_name\` varchar(191) NULL AFTER \`secondary_color\`,
  ADD COLUMN \`contact_person_email\` varchar(191) NULL AFTER \`contact_person_name\`,
  ADD COLUMN \`contact_person_phone\` varchar(191) NULL AFTER \`contact_person_email\`,
  ADD COLUMN \`mission_statement\` varchar(191) NULL AFTER \`contact_person_phone\`,
  ADD COLUMN \`vision_statement\` varchar(191) NULL AFTER \`mission_statement\`,
  ADD COLUMN \`motto\` varchar(191) NULL AFTER \`vision_statement\`,
  ADD COLUMN \`max_campuses\` int NULL AFTER \`motto\`,
  ADD COLUMN \`max_students\` int NULL AFTER \`max_campuses\`,
  MODIFY COLUMN \`status\` ENUM('ACTIVE','INACTIVE','SUSPENDED','CLOSED') NOT NULL DEFAULT 'ACTIVE';
`;

(async () => {
  await p.$executeRawUnsafe(sql);
  console.log('university table synced');
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e.message);
  await p.$disconnect();
  process.exit(1);
});
