const { execSync } = require('child_process');

const filesToRestore = [
  "app/(auth)/forgot-password/page.tsx",
  "app/(auth)/login/page.tsx",
  "app/(auth)/reset-password/page.tsx",
  "app/(auth)/signup/page.tsx",
  "app/dashboards/page.tsx",
  "app/projects/[code]/dashboards/page.tsx",
  "app/projects/[code]/plans/[planId]/page.tsx",
  "app/projects/[code]/runs/page.tsx",
  "app/projects/[code]/settings/access-control/AccessControlClient.tsx",
  "app/projects/[code]/settings/general/GeneralSettingsClient.tsx",
  "app/projects/[code]/settings/members/MembersListClient.tsx",
  "app/workspace/fields/FieldsClient.tsx",
  "app/workspace/groups/page.tsx",
  "app/workspace/invites/page.tsx",
  "app/workspace/roles/[id]/page.tsx",
  "app/workspace/roles/create/page.tsx",
  "app/workspace/roles/page.tsx",
  "components/layout/ProjectSidebar.tsx",
  "components/layout/TopNav.tsx",
  "components/layout/WorkspaceSidebar.tsx",
  "components/repository/BulkEditModal.tsx",
  "components/repository/RepositoryHeader.tsx",
  "components/runs/ReportBugModal.tsx",
  "components/workspace/InviteMemberButton.tsx",
  "components/workspace/InviteUserModal.tsx",
  "components/workspace/UserActionMenu.tsx"
];

for (const file of filesToRestore) {
  try {
    // We can use git checkout to restore the file
    // Note: since the file path contains brackets, we just escape the quotes
    execSync(`git checkout -- "${file}"`, { stdio: 'inherit' });
    console.log(`Restored ${file}`);
  } catch (err) {
    console.error(`Failed to restore ${file}: ${err.message}`);
  }
}
