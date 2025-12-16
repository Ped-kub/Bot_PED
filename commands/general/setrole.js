const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setauthorizedrole')
        .setDescription('กำหนด Role ID ที่สามารถใช้คำสั่งบอทได้ทั้งหมด')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('เลือกยศที่ต้องการอนุญาต')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator), // จำกัดให้เฉพาะ Admin ใช้คำสั่งนี้ได้

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const configPath = path.join(__dirname, '../../config.json');

        try {
            // อ่าน config เก่า
            let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // อัปเดต Role ID ใหม่
            config.authorizedRoleId = role.id;
            
            // บันทึก config กลับลงไฟล์
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

            await interaction.reply({ 
                content: `กำหนดให้ยศ **${role.name}** (${role.id}) เป็นยศที่ได้รับอนุญาตแล้ว`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลครับ', ephemeral: true });
        }
    },
};