const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const AutoMove = require('../../models/AutoMove');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automove')
        .setDescription('จัดการระบบย้ายผู้ใช้蜕อัตโนมัติ')
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
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // ใช้ editReply เพราะ index.js มีการสั่ง deferReply ไว้แล้ว
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
                return interaction.editReply(`✅ ตั้งค่าให้ย้าย **${user.tag}** ไปยังห้อง <#${channel.id}> อัตโนมัติเรียบร้อย`);

            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                const deleted = await AutoMove.findOneAndDelete({ userId: user.id, guildId: guildId });
                if (!deleted) return interaction.editReply('❌ ไม่พบผู้ใช้นี้ในรายการครับ');
                return interaction.editReply(`❌ ยกเลิกการย้ายอัตโนมัติของ **${user.tag}** เรียบร้อย`);

            } else if (subcommand === 'list') {
                const list = await AutoMove.find({ guildId: guildId });

                if (list.length === 0) {
                    return interaction.editReply('📭 ขณะนี้ไม่มีรายชื่อผู้ใช้ในระบบ Auto Move ครับ');
                }

                // สร้างข้อความรายชื่อ (แสดงชื่อคนโดนย้าย -> ห้องปลายทาง)
                const moveList = list.map((item, index) => {
                    return `${index + 1}. <@${item.userId}> ➡️ <#${item.targetChannelId}>`;
                }).join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00) // สีเขียว
                    .setTitle('📋 รายชื่อเป้าหมาย Auto Move')
                    .setDescription(moveList)
                    .setFooter({ text: `ทั้งหมด ${list.length} รายชื่อ` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            return interaction.editReply('เกิดข้อผิดพลาดในการเข้าถึงฐานข้อมูล');
        }
    }
};