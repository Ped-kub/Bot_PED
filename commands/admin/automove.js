const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const AutoMove = require('../../models/AutoMove');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automove')
        .setDescription('จัดการระบบย้ายผู้ใช้蜕อัตโนมัติ')
        // ตั้งค่าเบื้องต้นให้คนที่มีสิทธิ์จัดการสมาชิกเห็นคำสั่งนี้
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers) 
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('กำหนดผู้ใช้และห้องปลายทาง')
                .addUserOption(opt => opt.setName('user').setDescription('เลือกผู้ใช้').setRequired(true))
                .addChannelOption(opt => 
                    opt.setName('channel')
                       .setDescription('เลือกห้องเสียงปลายทาง')
                       .addChannelTypes(ChannelType.GuildVoice)
                       .setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('ยกเลิกการย้ายอัตโนมัติสำหรับผู้ใช้')
                .addUserOption(opt => opt.setName('user').setDescription('เลือกผู้ใช้').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('ดูรายชื่อผู้ใช้ที่อยู่ในระบบ Auto Move ทั้งหมด')
        ),

    async execute(interaction) {
        // --- 1. ตรวจสอบยศที่กำหนด (Role Check) ---
        const allowedRoleIDs = [
            '1443797915230539928', 
            '1393129924671307796',
            '1393122803871387738'  
        ];

        // ตรวจสอบว่าผู้ใช้มียศที่กำหนด หรือเป็น Administrator ของเซิร์ฟเวอร์
        const hasPermission = interaction.member.roles.cache.hasAny(...allowedRoleIDs) || 
                              interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.editReply({ 
                content: '❌ ขออภัยครับ เฉพาะผู้ที่มีบทบาทที่กำหนดเท่านั้นที่สามารถใช้คำสั่งนี้ได้', 
                ephemeral: true 
            });
        }

        // --- 2. เริ่มการทำงานตามคำสั่ง (เหมือนเดิม) ---
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (subcommand === 'set') {
                const user = interaction.options.getUser('user');
                const channel = interaction.options.getChannel('channel');
                
                await AutoMove.findOneAndUpdate(
                    { userId: user.id, guildId: guildId },
                    { targetChannelId: channel.id, addedBy: interaction.user.id },
                    { upsert: true, new: true }
                );
                return interaction.editReply(`✅ ตั้งค่าให้ย้าย **${user.tag}** ไปยังห้อง <#${channel.id}> เรียบร้อย`);

            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                const deleted = await AutoMove.findOneAndDelete({ userId: user.id, guildId: guildId });
                if (!deleted) return interaction.editReply('❌ ไม่พบผู้ใช้นี้ในรายการครับ');
                return interaction.editReply(`❌ ยกเลิกการย้ายอัตโนมัติของ **${user.tag}** เรียบร้อย`);

            } else if (subcommand === 'list') {
                const list = await AutoMove.find({ guildId: guildId });
                if (list.length === 0) return interaction.editReply('📭 ขณะนี้ไม่มีรายชื่อผู้ใช้ในระบบ Auto Move');

                const moveList = list.map((item, index) => `${index + 1}. <@${item.userId}> ➡️ <#${item.targetChannelId}>`).join('\n');
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('📋 รายชื่อเป้าหมาย Auto Move')
                    .setDescription(moveList)
                    .setFooter({ text: `ทั้งหมด ${list.length} รายชื่อ` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            return interaction.editReply('เกิดข้อผิดพลาดในการประมวลผล');
        }
    }
};