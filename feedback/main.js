import { Database } from "bun:sqlite"
import * as he from "he"

const db = new Database("messages.sqlite");
db.run(`
CREATE TABLE IF NOT EXISTS Messages (
    Message       STRING
)
`);

const insert = db.prepare("INSERT INTO Messages VALUES (?)");
const query = db.prepare("SELECT Message FROM Messages");

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
            "POST": async req => {
                const text = (await req.text()).trim();

                console.log(text);

                if (text.length <= 1000 && text.length != 0) {
                    const safe = he.encode(text);
                    insert.run(safe);
                }

                return new Response("donezo funzo", { headers: { "Access-Control-Allow-Origin": "*" } });
            },
            "GET": Response.redirect("/feedback")
        },

        "/feedback": req => {
            const messages = query.all();

            const messagesString = messages.map(
                (message, i) => 
                        `<marquee behavior="alternate" scrolldelay="${Math.random()*500}" direction="right" style="padding-left: ${i*20}px">${message.Message.replace("\n", "<br/>")}</marquee>`
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
