# PostgreSQL Schema Comparison Tool

## Overview
This tool compares the schemas of two PostgreSQL databases and highlights differences in:
- **Tables** (missing or extra tables)
- **Columns** (missing, extra, and datatype differences)
- **Stored Procedures & Functions** (missing, extra, and content differences)

## Features
✅ Dark Mode UI  
✅ Table-Based Results Display  
✅ Download Report as CSV  
✅ Loader for Better User Experience  
✅ Comment & Whitespace Normalization for Procedure Comparison  

## Installation

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v14+ recommended)
- **PostgreSQL** (Ensure both databases are accessible)

### Clone the Repository
```bash
git clone https://github.com/yourusername/schema-comparison-tool.git
cd schema-comparison-tool
```

### Install Dependencies
```bash
npm install
```

## Configuration
Create a `.env` file to store database connection details (if needed). Otherwise, enter details manually in the UI.

## Usage
### Start the Server
```bash
node server.js
```

### Access the UI
Open your browser and go to:
```
http://localhost:3000
```

### Compare Schemas
1. Enter the connection details for both databases.
2. Click **Compare Schemas**.
3. View differences in tables, columns, and stored procedures.
4. Download the report as a CSV if needed.

## API Endpoints
### Compare Schemas
**POST** `/compare`

**Request Body:**
```json
{
  "db_1_host": "localhost",
  "db_1_port": "5432",
  "db_1_database": "db1",
  "db_1_user": "postgres",
  "db_1_password": "password",
  "db_1_schema": "public",
  "db_2_host": "localhost",
  "db_2_port": "5432",
  "db_2_database": "db2",
  "db_2_user": "postgres",
  "db_2_password": "password",
  "db_2_schema": "public"
}
```

**Response Example:**
```json
{
  "missingTables": [],
  "extraTables": ["table_x", "table_y"],
  "tableDifferences": {
    "users": {
      "missingColumns": ["age"],
      "extraColumns": ["nickname"],
      "datatypeDifferences": {"id": {"expected": "integer", "found": "varchar"}}
    }
  },
  "missingFunctions": [],
  "extraFunctions": [],
  "functionDifferences": {
    "update_user": {
      "expected": "BEGIN UPDATE users SET ... END;",
      "found": "BEGIN -- Comment UPDATE users SET ... END;"
    }
  }
}
```

## Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push the branch: `git push origin feature-name`
5. Open a pull request.

## License
MIT License

