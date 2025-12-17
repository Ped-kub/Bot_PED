const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('บอทเข้าร่วมช่องเสียง')
    .setDMPermission(false) // ไม่อนุญาตให้ใช้คำสั่งนี้ใน DM
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('ช่องเสียงที่ต้องการให้บอทเข้าร่วม')
        .addChannelTypes(ChannelType.GuildVoice) // จำกัดให้เป็นแค่ช่องเสียง
        .setRequired(false)
    ),

  async execute(interaction) {
    let targetChannel = interaction.options.getChannel('channel');

    // ถ้าผู้ใช้ไม่ได้ระบุช่อง ให้ใช้ช่องที่ผู้ใช้กำลังอยู่
    if (!targetChannel) {
      const userVoiceState = interaction.member.voice;

      if (!userVoiceState || !userVoiceState.channel) {
        return interaction.reply({ content: 'คุณต้องอยู่ในช่องเสียง หรือระบุช่องเสียงที่ต้องการให้บอทเข้าร่วมครับ', ephemeral: true });
      }

      targetChannel = userVoiceState.channel;
    }

    // ตรวจสอบสิทธิ์ของบอท
    if (!targetChannel.joinable) {
        return interaction.reply({ content: `บอทไม่มีสิทธิ์เข้าร่วมช่องเสียง "${targetChannel.name}" ครับ`, ephemeral: true });
    }

    try {
      // ใช้ joinVoiceChannel จาก @discordjs/voice
      const connection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('The bot has connected to the voice channel!');
      });

      await interaction.reply({ content: `เข้าร่วมช่องเสียง **${targetChannel.name}** แล้วครับ!`, ephemeral: true });

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'มีข้อผิดพลาดในการเข้าร่วมช่องเสียงครับ', ephemeral: true });
    }
  },
};