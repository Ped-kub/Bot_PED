const { SlashCommandBuilder } = require('discord.js');
const { createMenuEmbed, createMenuDropdown } = require('../../menuUtils.js'); // ปรับ path ตามจริง

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('แสดงเมนูหลักของบอทพร้อมตัวเลือก Dropdown'),
  async execute(interaction) {
    const menuEmbed = createMenuEmbed();
    const menuComponents = createMenuDropdown();

    await interaction.reply({
      embeds: [menuEmbed],
      components: menuComponents,
      ephemeral: true
    });
  },
};