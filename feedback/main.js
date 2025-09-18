import { Database } from "bun:sqlite"
import * as he from "he"

const db = new Database("messages.sqlite");
db.run(`
CREATE TABLE IF NOT EXISTS Messages (
    Message       STRING
)
`);

const insert = db.prepare("INSERT INTO Messages VALUES (?)");
const query = db.prepare("SELECT Message FROM Messages ORDER BY RANDOM()");

const html = `
<!DOCTYPE html>

<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        <title>Feedback</title>

        <style>
            blink {
                animation: blink-animation 1s steps(2, start) infinite;
            }

            @keyframes blink-animation {
                to {
                    visibility: hidden;
                }
            }
        </style>
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
            const rows = query.all();

            const htmlString = rows.map(
                (cell, i) => {
                    let message = cell.Message;
                    return `
${message.includes("blink") ? "<blink>" : ""}
<marquee
    behavior="alternate"
    scrolldelay="${Math.random()*500}"
    direction="right"
    style="
        padding-left: ${i*20}px;
        font-size: ${(-(message.length ** 2 / 100000) + 25)}px;
        margin-bottom: 10px;
    "
>
${message.replaceAll("\n", "<br/>")}
</marquee>
${message.includes("blink") ? "</blink>" : ""}
                        `; }
            ).join("\n");
            
            return new Response(
                html.replace("{{{content}}}", htmlString),
                {
                    headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" }
                }
            );
        }
    },

    port: 2003
});

console.log("Feedback server running on port 2003");
