const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AutoKick = require('../../models/AutoKick'); // นำเข้า Model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autokick')
        .setDescription('จัดการรายชื่อคนที่จะโดนตัดการเชื่อมต่อ (บันทึกลง Database)')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('เพิ่มคนเข้ากลุ่มเป้าหมาย')
                .addUserOption(opt => opt.setName('user').setDescription('เลือกผู้ใช้').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('ลบคนออกจากกลุ่มเป้าหมาย')
                .addUserOption(opt => opt.setName('user').setDescription('เลือกผู้ใช้').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
    // เช็คก่อนว่ามีการตอบกลับไปหรือยัง ถ้ายังค่อยสั่ง deferReply
    if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply({ ephemeral: true });
}

    const user = interaction.options.getUser('user');
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
        if (subcommand === 'add') {
            const exists = await AutoKick.findOne({ userId: user.id, guildId: guildId });
            if (exists) return interaction.editReply('❌ ผู้ใช้นี้อยู่ในรายการอยู่แล้วครับ');

            await AutoKick.create({
                userId: user.id,
                guildId: guildId,
                addedBy: interaction.user.id
            });
            return interaction.editReply(`✅ เพิ่ม **${user.tag}** ลงระบบ Auto Kick เรียบร้อย`);

        } else if (subcommand === 'remove') {
            const deleted = await AutoKick.findOneAndDelete({ userId: user.id, guildId: guildId });
            if (!deleted) return interaction.editReply('❌ ไม่พบผู้ใช้นี้ในรายการครับ');
            
            return interaction.editReply(`❌ ลบ **${user.tag}** ออกจากระบบแล้ว`);
        }
    } catch (error) {
        console.error('Database Error:', error);
        // ใช้ editReply เพราะเราสั่ง deferReply ไว้ข้างบนแล้ว
        return interaction.editReply('เกิดข้อผิดพลาดในการจัดการ Database');
    }
}
}