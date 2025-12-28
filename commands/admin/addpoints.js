const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// 🔒 รายชื่อ ID ที่มีสิทธิ์ใช้คำสั่งนี้
const ADMIN_IDS = [
    '910909335784288297',  //เป็ด
    '774417760281165835',   // พี่เเอล
    '1319982025557413949',  //คุณมิริม
    '1056886143754444840',  //เกโต้
    '926336093253677157',   //โอม
    '1390444294988369971'  //พี่โทจิ
] 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('เพิ่มแต้มให้กับผู้ใช้ (Admin Only)')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('คนที่จะให้แต้ม')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('จำนวนแต้ม')
                .setRequired(true)),
                
    async execute(interaction) {
        // 1. เช็คสิทธิ์ Admin
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const usersPath = path.join(__dirname, '../../users.json');

        // เช็คว่าจำนวนถูกต้องไหม (ต้องมากกว่า 0)
        if (amount <= 0) {
            return interaction.reply({ content: '❌ จำนวนแต้มต้องมากกว่า 0', ephemeral: true });
        }

        // 2. โหลดข้อมูล
        let users = {};
        try {
            if (fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        } catch (e) {}

        // ถ้า User เป้าหมายยังไม่มีข้อมูล ให้สร้างใหม่
        if (!users[targetUser.id]) {
            users[targetUser.id] = { points: 0 };
        }

        // 3. เพิ่มแต้ม
        users[targetUser.id].points += amount;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        // 4. แจ้งผล
        await interaction.reply({
            content: `✅ **เพิ่มแต้มสำเร็จ!**\n👤 ให้กับ: ${targetUser}\n➕ จำนวน: **${amount}** แต้ม\n💰 ยอดรวมปัจจุบัน: **${users[targetUser.id].points}** แต้ม`
        });
    },
};