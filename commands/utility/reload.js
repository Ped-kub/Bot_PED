const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // ส่วนที่ 1: การตั้งชื่อคำสั่ง
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('รีโหลดโค้ดคำสั่งใหม่')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('ชื่อไฟล์คำสั่งที่ต้องการอัปเดต')
                .setRequired(true)),

    // ส่วนที่ 2: ฟังก์ชัน execute (ต้องเอาโค้ดไว้ในนี้เท่านั้น!)
    async execute(interaction) {
        // ✅ บรรทัดนี้ต้องอยู่ภายในปีกกาของ execute เท่านั้น
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply(`ไม่พบคำสั่งชื่อ \`${commandName}\` ครับ`);
        }

        // หาตำแหน่งไฟล์คำสั่ง
        const fs = require('node:fs');
        const path = require('node:path');
        const foldersPath = path.join(__dirname, '..');
        const commandFolders = fs.readdirSync(foldersPath);
        let filePath;

        for (const folder of commandFolders) {
            const tempPath = path.join(foldersPath, folder, `${commandName}.js`);
            if (fs.existsSync(tempPath)) {
                filePath = tempPath;
                break;
            }
        }

        // ล้าง Cache และโหลดใหม่
        delete require.cache[require.resolve(filePath)];

        try {
            const newCommand = require(filePath);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply(`อัปเดตคำสั่ง \`${newCommand.data.name}\` สำเร็จ!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`เกิดข้อผิดพลาด: \`${error.message}\``);
        }
    },
};