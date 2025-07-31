# Testing Documentation

This directory contains comprehensive tests for the Discord Bot V1 project.

## Test Structure

```
tests/
├── setup/
│   └── setupTests.js          # Global test setup and MongoDB configuration
├── mocks/
│   └── discord.js             # Mock Discord.js objects for testing
├── unit/
│   ├── commands/              # Unit tests for slash commands
│   ├── events/                # Unit tests for event handlers
│   ├── models/                # Unit tests for database models
│   └── utils/                 # Unit tests for utility functions
├── integration/               # Integration tests for complete workflows
└── testHelpers.js             # Helper functions for creating test data
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### With Coverage Report

```bash
npm run test:coverage
```

## Test Categories

### Unit Tests

- **Commands**: Test individual slash command logic and responses
- **Events**: Test event handler behavior and database operations
- **Models**: Test database schema validation and operations
- **Utils**: Test utility functions like date calculations

### Integration Tests

- **Absence Workflow**: Test complete absence creation and listing flow
- **Absence Removal**: Test complete absence removal workflow
- **Error Handling**: Test graceful error handling across components

## Test Environment

- **Database**: Uses MongoDB Memory Server for isolated testing
- **Discord.js**: Mocked to avoid actual Discord API calls
- **Environment**: Isolated test environment with mock data

## Key Features

### Database Testing

- Each test runs with a clean in-memory MongoDB instance
- All collections are cleared between tests
- Real database operations without external dependencies

### Discord.js Mocking

- Complete mock of Discord.js classes and methods
- Realistic interaction simulation
- No actual API calls during testing

### Helper Functions

- `createTestAbsence()`: Generate test absence data
- `createMockCommandInteraction()`: Create mock slash command interactions
- `createMockSelectInteraction()`: Create mock select menu interactions
- `assertInteractionReply()`: Verify interaction responses

## Test Data

### Mock Users

```javascript
const mockUser = new MockUser("user123", "testuser", "Test User");
```

### Mock Interactions

```javascript
const interaction = createMockCommandInteraction({
  user: mockUser,
  guild: { id: "guild123" },
  targetUser: targetUser,
});
```

### Test Absences

```javascript
const absence = createTestAbsence({
  userId: "user123",
  raidDate: new Date("2025-07-24T00:00:00Z"),
});
```

## Best Practices

1. **Isolation**: Each test is completely isolated with fresh data
2. **Mocking**: All external dependencies are mocked
3. **Assertions**: Use helper functions for consistent assertions
4. **Coverage**: Aim for high coverage of business logic
5. **Documentation**: Tests serve as living documentation

## Test Coverage

The test suite covers:

- ✅ Command validation and responses
- ✅ Database operations and data integrity
- ✅ Event handling and interaction flows
- ✅ Error handling and edge cases
- ✅ Permission checking
- ✅ Date calculations and formatting
- ✅ Complete user workflows

## Adding New Tests

### For a new command:

1. Create test file in `tests/unit/commands/`
2. Mock Discord.js imports
3. Test command structure and execution
4. Test error scenarios

### For a new event:

1. Create test file in `tests/unit/events/`
2. Test event registration and filtering
3. Test interaction handling
4. Test database operations

### For integration scenarios:

1. Create test file in `tests/integration/`
2. Test complete user workflows
3. Test error propagation
4. Test data consistency

## Continuous Integration

Tests are designed to run in CI environments:

- No external dependencies
- Deterministic results
- Fast execution
- Comprehensive coverage

Run `npm run test:coverage` to generate detailed coverage reports.
