const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User'); // 1. เรียกใช้ Model MongoDB

// 🔒 รายชื่อ ID ที่มีสิทธิ์ใช้คำสั่งนี้
const ADMIN_IDS = [
    '910909335784288297',  //เป็ด
    '774417760281165835',   // พี่เเอล
    '1319982025557413949',  //คุณมิริม
    '1056886143754444840',  //เกโต้
    '926336093253677157',   //โอม
    '1390444294988369971'  //พี่โทจิ
];

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
            return interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้' });
        }

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        // เช็คว่าจำนวนถูกต้องไหม (ต้องมากกว่า 0)
        if (amount <= 0) {
            return interaction.editReply({ content: '❌ จำนวนแต้มต้องมากกว่า 0' });
        }

        // 2. ดึงข้อมูลจาก MongoDB
        let userData = await User.findOne({ userId: targetUser.id });

        // ถ้ายังไม่มี User นี้ในระบบ ให้สร้างใหม่
        if (!userData) {
            userData = new User({ 
                userId: targetUser.id, 
                points: 0 
            });
        }

        // 3. เพิ่มแต้ม
        userData.points += amount;

        // 4. บันทึกลง Database
        await userData.save();

        // 5. แจ้งผล
        await interaction.editReply({
            content: `✅ **เพิ่มแต้มสำเร็จ!**\n👤 ให้กับ: ${targetUser}\n➕ จำนวน: **${amount}** แต้ม\n💰 ยอดรวมปัจจุบัน: **${userData.points}** แต้ม`
        });
    },
};