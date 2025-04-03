document.getElementById('compareForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    document.getElementById('loader').style.display = 'block';
    document.getElementById('result').innerHTML = '';

    const requestData = {
        db_1_host: document.getElementById('db1_host').value,
        db_1_port: document.getElementById('db1_port').value,
        db_1_database: document.getElementById('db1_database').value,
        db_1_user: document.getElementById('db1_user').value,
        db_1_password: document.getElementById('db1_password').value,
        db_1_schema: document.getElementById('db1_schema').value,

        db_2_host: document.getElementById('db2_host').value,
        db_2_port: document.getElementById('db2_port').value,
        db_2_database: document.getElementById('db2_database').value,
        db_2_user: document.getElementById('db2_user').value,
        db_2_password: document.getElementById('db2_password').value,
        db_2_schema: document.getElementById('db2_schema').value,
    };

    try {
        const response = await fetch('/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();
        document.getElementById('loader').style.display = 'none';

        if (data.error) {
            document.getElementById('result').innerHTML = `<p>Error: ${data.error}</p>`;
            return;
        }

        let html = `<h2>Schema Differences</h2>`;

        // Display Extra Tables
        if (data.extraTables?.length) {
            html += `<h3>Extra Tables</h3><ul>`;
            data.extraTables.forEach(table => {
                html += `<li>${table}</li>`;
            });
            html += `</ul>`;
        }

        // Display Table Column Differences
        if (data.tableDifferences && Object.keys(data.tableDifferences).length > 0) {
            html += `<h3>Table Column Differences</h3>`;
            for (let table in data.tableDifferences) {
                html += `<h4>Table: ${table}</h4>`;
                html += `<table border="1"><tr><th>Column</th><th>Issue</th></tr>`;

                // Missing Columns
                if (data.tableDifferences[table].missingColumns?.length) {
                    data.tableDifferences[table].missingColumns.forEach(column => {
                        html += `<tr><td>${column}</td><td style="color: red;">Missing</td></tr>`;
                    });
                }

                // Extra Columns
                if (data.tableDifferences[table].extraColumns?.length) {
                    data.tableDifferences[table].extraColumns.forEach(column => {
                        html += `<tr><td>${column}</td><td style="color: orange;">Extra</td></tr>`;
                    });
                }

                // Datatype Differences
                if (data.tableDifferences[table].datatypeDifferences && Object.keys(data.tableDifferences[table].datatypeDifferences).length > 0) {
                    for (let column in data.tableDifferences[table].datatypeDifferences) {
                        html += `<tr><td>${column}</td><td>Expected: ${data.tableDifferences[table].datatypeDifferences[column].expected} → Found: ${data.tableDifferences[table].datatypeDifferences[column].found}</td></tr>`;
                    }
                }

                html += `</table>`;
            }
        }

        // Display Procedure Differences
        if (data.functionDifferences && Object.keys(data.functionDifferences).length > 0) {
            html += `<h3>Function Differences</h3>`;
            for (let func in data.functionDifferences) {
                html += `<h4>Function: ${func}</h4>`;
                html += `<pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;"><strong>Expected:</strong>\n${data.functionDifferences[func].expected}\n\n<strong>Found:</strong>\n${data.functionDifferences[func].found}</pre>`;
            }
        }

        document.getElementById('result').innerHTML = html;
    } catch (error) {
        document.getElementById('result').innerHTML = `<p>Error fetching schema differences.</p>`;
        console.error(error);
    }
});
