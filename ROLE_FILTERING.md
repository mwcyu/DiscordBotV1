# Role Filtering Feature

## Overview

The bot now supports role-based filtering for raid commands. Server admins can configure a specific role, and only users with that role will be able to use raid-related commands and appear in user selection dropdowns.

## Commands

### `/roleconfig`

**Permission Required:** Manage Server
**Description:** Configure which role the bot will filter for raids

**Usage:**

- `/roleconfig role:@RaidMember` - Set role filter to "RaidMember" role
- `/roleconfig` - Remove role filter (allow all users)

### `/roleinfo`

**Description:** Show current role filter configuration
**Usage:** `/roleinfo`

## How It Works

### When Role Filter is Configured:

1. Only users with the specified role can use `/absent`, `/absentremove` commands
2. Only users with the specified role can be selected in `/adminabsentremove`
3. The `/absentlist` command still shows all absences but only filtered users can create them

### When No Role Filter is Configured:

- All users can use raid commands (default behavior)

## Examples

### Setting up a role filter:

1. Admin runs: `/roleconfig role:@Raiders`
2. Bot responds: "✅ Role Filter Configured - Bot will now only show users with the **Raiders** role in raid commands."

### Checking current configuration:

1. User runs: `/roleinfo`
2. Bot shows current role filter status and member count

### Removing role filter:

1. Admin runs: `/roleconfig` (without selecting a role)
2. Bot responds: "✅ Role Filter Removed - Bot will now show all users in raid commands."

## Error Handling

- Users without required role see: "❌ You don't have the required role for raid management."
- If configured role is deleted, `/roleinfo` will show a warning
- Commands gracefully fall back to showing all users if there are database errors

## Technical Notes

- Role filtering is stored per-guild in MongoDB
- Configuration persists across bot restarts
- Uses guild member cache for efficient role checking
- Backward compatible - existing setups without role filters continue working
