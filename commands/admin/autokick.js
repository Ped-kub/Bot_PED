const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AutoKick = require('../../models/AutoKick');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autokick')
        .setDescription('จัดการระบบตัดการเชื่อมต่ออัตโนมัติ')
        // ให้คนที่มีสิทธิ์ย้ายสมาชิกเห็นคำสั่งเบื้องต้น
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
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
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('ดูรายชื่อเป้าหมายทั้งหมดในเซิร์ฟเวอร์นี้')
        ),

    async execute(interaction) {
        // --- 1. กำหนด Role ID ที่อนุญาตให้ใช้คำสั่งนี้ ---
        const allowedRoleIDs = [
            '123456789012345678', // แทนที่ด้วย ID ยศ Staff/Admin ของคุณ
        ];

        // ตรวจสอบสิทธิ์: มียศที่กำหนด OR เป็น Administrator
        const hasPermission = interaction.member.roles.cache.hasAny(...allowedRoleIDs) || 
                              interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.editReply({ 
                content: '❌ เฉพาะผู้ที่มีบทบาทที่กำหนดเท่านั้นที่สามารถใช้คำสั่งนี้ได้', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (subcommand === 'add') {
                const user = interaction.options.getUser('user');
                const exists = await AutoKick.findOne({ userId: user.id, guildId: guildId });
                
                if (exists) return interaction.editReply('❌ ผู้ใช้นี้อยู่ในรายการอยู่แล้วครับ');

                await AutoKick.create({ 
                    userId: user.id, 
                    guildId: guildId, 
                    addedBy: interaction.user.id 
                });
                return interaction.editReply(`✅ เพิ่ม **${user.tag}** เข้าสู่ระบบ Auto Kick เรียบร้อย`);

            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                const deleted = await AutoKick.findOneAndDelete({ userId: user.id, guildId: guildId });
                
                if (!deleted) return interaction.editReply('❌ ไม่พบผู้ใช้นี้ในรายการครับ');
                return interaction.editReply(`❌ ลบ **${user.tag}** ออกจากระบบเรียบร้อย`);

            } else if (subcommand === 'list') {
                // ดึงรายชื่อทั้งหมดจาก Database เฉพาะของเซิร์ฟเวอร์นี้
                const list = await AutoKick.find({ guildId: guildId });

                if (list.length === 0) {
                    return interaction.editReply('📭 ขณะนี้ไม่มีรายชื่อผู้ใช้ในระบบ Auto Kick ครับ');
                }

                // สร้างรายการรายชื่อ (Mention ผู้ใช้ เพื่อให้กดดูโปรไฟล์ได้)
                const userList = list.map((item, index) => {
                    return `${index + 1}. <@${item.userId}> (ID: \`${item.userId}\`)`;
                }).join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0xFFAA00)
                    .setTitle('📋 รายชื่อเป้าหมาย Auto Disconnect')
                    .setDescription(userList)
                    .setFooter({ text: `จำนวนทั้งหมด: ${list.length} รายชื่อ` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('AutoKick Error:', error);
            return interaction.editReply('เกิดข้อผิดพลาดในการประมวลผลข้อมูลใน Database');
        }
    }
};