const express = require('express');
const pgp = require('pg-promise')();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

function normalizeProcedure(proc) {
    return proc
        .replace(/\r\n/g, "\n")         // Normalize line endings
        .replace(/\s+/g, " ")           // Collapse extra spaces
        .replace(/--.*$/gm, "")         // Remove inline comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
        .trim();                        // Remove trailing/leading whitespace
}

async function compareSchemas(db1, schema1, db2, schema2) {
    try {        
        console.log(`Comparing schemas: ${schema1} vs ${schema2}`);

        // Get tables
        const tables1 = await db1.any("SELECT table_name FROM information_schema.tables WHERE table_schema = $1", [schema1]);
        const tables2 = await db2.any("SELECT table_name FROM information_schema.tables WHERE table_schema = $1", [schema2]);

        const tableNames1 = tables1.map(t => t.table_name);
        const tableNames2 = tables2.map(t => t.table_name);

        const missingTables = tableNames1.filter(t => !tableNames2.includes(t));
        const extraTables = tableNames2.filter(t => !tableNames1.includes(t));

        let differences = { 
            missingTables, 
            extraTables, 
            tableDifferences: {}, 
            missingFunctions: [], 
            extraFunctions: [], 
            functionDifferences: {} 
        };

        // Compare columns & datatypes
        for (let table of tableNames1) {
            const columns1 = await db1.any("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2", [schema1, table]);
            const columns2 = await db2.any("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2", [schema2, table]);

            const columnDetails1 = Object.fromEntries(columns1.map(c => [c.column_name, c.data_type]));
            const columnDetails2 = Object.fromEntries(columns2.map(c => [c.column_name, c.data_type]));

            const missingColumns = Object.keys(columnDetails1).filter(c => !columnDetails2.hasOwnProperty(c));
            const extraColumns = Object.keys(columnDetails2).filter(c => !columnDetails1.hasOwnProperty(c));

            let datatypeDifferences = {};
            Object.keys(columnDetails1).forEach(column => {
                if (columnDetails2.hasOwnProperty(column) && columnDetails1[column] !== columnDetails2[column]) {
                    datatypeDifferences[column] = { expected: columnDetails1[column], found: columnDetails2[column] };
                }
            });

            if (missingColumns.length || extraColumns.length || Object.keys(datatypeDifferences).length) {
                differences.tableDifferences[table] = { missingColumns, extraColumns, datatypeDifferences };
            }
        }

        // Compare functions & their contents
        const funcs1 = await db1.any("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_schema = $1", [schema1]);
        const funcs2 = await db2.any("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_schema = $1", [schema2]);

        const funcMap1 = Object.fromEntries(funcs1.map(f => [f.routine_name, f.routine_definition || ""]));
        const funcMap2 = Object.fromEntries(funcs2.map(f => [f.routine_name, f.routine_definition || ""]));

        differences.missingFunctions = Object.keys(funcMap1).filter(f => !funcMap2.hasOwnProperty(f));
        differences.extraFunctions = Object.keys(funcMap2).filter(f => !funcMap1.hasOwnProperty(f));

        Object.keys(funcMap1).forEach(func => {
            if (funcMap2.hasOwnProperty(func) && normalizeProcedure(funcMap1[func]) !== normalizeProcedure(funcMap2[func])) {
                differences.functionDifferences[func] = {
                    expected: funcMap1[func],
                    found: funcMap2[func]
                };
            }
        });

        return differences;
    } catch (error) {
        console.error("Error comparing schemas:", error);
        return { error: "Error fetching schema differences" };
    }
}


app.get("/", (req, res) => {
    res.render('index', { differences: {} });
})

app.post('/compare', async (req, res) => {
    const { db_1_host, db_1_port, db_1_database, db_1_user, db_1_password, db_1_schema,
        db_2_host, db_2_port, db_2_database, db_2_user, db_2_password, db_2_schema } = req.body;

    try {
        // Database connection details
        const db1 = pgp({
            host: db_1_host,
            port: db_1_port,
            database: db_1_database,
            user: db_1_user,
            password: db_1_password
        });

        const db2 = pgp({
            host: db_2_host,
            port: db_2_port,
            database: db_2_database,
            user: db_2_user,
            password: db_2_password
        });

        const differences = await compareSchemas(db1, db_1_schema, db2, db_2_schema);
        res.json(differences);

    } catch (error) {
        console.error("Error comparing schemas:", error);
        res.json({ error: "Error fetching schema differences" });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});