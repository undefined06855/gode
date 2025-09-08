import { Database } from "bun:sqlite"
import * as he from "he"

const db = new Database("messages.sqlite");
db.run(`
CREATE TABLE IF NOT EXISTS Messages (
    Message       STRING PRIMARY KEY
)
`);

const insert = db.prepare("INSERT INTO Messages VALUES (?)");
const query = db.prepare("SELECT * FROM Messages");

const html = `
<!DOCTYPE html>

<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        <title>Feedback</title>
    </head>
    <body>
        {{{content}}}
    </body>
</html>
`;

Bun.serve({
    routes: {
        "/": {
            "POST": req => {
                if (!req.body) return new Response("no body?");

                const safe = he.encode(req.body.text());
                insert.run(safe);

                return new Response("donezo funzo");
            },
            "GET": Response.redirect("/feedback"),
            "OPTIONS": new Response("", { headers: { "Access-Control-Allow-Origin": "*" } })
        },

        "/feedback": req => {
            const messages = query.all();

            const messagesString = messages.map(
                message => `<marquee behavior="alternate" scrolldelay="200" direction="right">${message}</marquee>`
            ).join("\n");
            
            return new Response(
                html.replace("{{{content}}}", messagesString),
                {
                    headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" }
                }
            );
        }
    },

    port: 2003
});

console.log("Feedback server running on port 2003");
