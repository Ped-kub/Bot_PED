require('dotenv').config();
const { REST, Routes,SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = '1449797772231442545';
const GUILD_ID = '1376283535962406942';

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] คำสั่งที่ ${filePath} ขาดคุณสมบัติ "data" หรือ "execute".`);
        }
    }
}

// Deploy คำสั่งไปยัง Discord API
const rest = new REST().setToken(TOKEN);

(async () => {
    try {
        console.log(`กำลังรีเฟรช ${commands.length} คำสั่ง (/)`);

        // ใช้คำสั่งนี้เพื่อ Deploy ไปยังเซิร์ฟเวอร์เดียว (เหมาะกับการทดสอบ)
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        
        console.log('รีเฟรชคำสั่งสำเร็จแล้ว!');
    } catch (error) {
        console.error(error);
    }
})();