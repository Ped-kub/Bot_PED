const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuOptionBuilder } = require('discord.js');

// --- สร้าง Embed Message (เหมือนเดิม) ---
const createMenuEmbed = () => {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('บริการต่างๆ')
    .setDescription('กรุณาเลือกเมนูที่ต้องการจาก Dropdown ด้านล่าง:')
    .setImage('https://www.craiyon.com/pt/image/GmCvgfvIQ9u2BXClxXtwuQ')
    .setTimestamp()
    .setFooter({ text: '© BOT By. Ped' });
  return embed;
};

// --- สร้าง Dropdown Menu ---
const createMenuDropdown = () => {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('main_menu_select')
    .setPlaceholder('เลือกบริการได้เลย')
    .addOptions(
      // ... options เดิมของคุณ ...
      new StringSelectMenuOptionBuilder()
        .setLabel('จ้างฟาม').setValue('Farm'),
      new StringSelectMenuOptionBuilder()
        .setLabel('ซื้อของ').setValue('Item'),
      new StringSelectMenuOptionBuilder()
        .setLabel('ซื้อตระกูล').setValue('Bloodline'),
      new StringSelectMenuOptionBuilder()
        .setLabel('พ่อค้าโตโต้เด็กเย็ดโม้').setValue('Trade_1'),
    );

  // สร้างปุ่ม Reset
  const resetButton = new ButtonBuilder()
    .setCustomId('reset_dropdown')
    .setLabel('รีเซ็ตการเลือก')
    .setStyle(ButtonStyle.Danger); // สีแดง

  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(resetButton);

  return [row1, row2];
};

// --- จัดการ Interaction (การเลือก Dropdown) ---
const handleInteraction = async (interaction) => {
  // กรณีเลือกจาก Dropdown
  if (interaction.isStringSelectMenu() && interaction.customId === 'main_menu_select') {
    const selectedValue = interaction.values[0];

    // รีเซ็ต Dropdown ทันทีหลังเลือก
    await interaction.update({ components: createMenuDropdown() });

    // ส่งข้อความตอบกลับ
    await interaction.followUp({ content: `คุณเลือก: ${selectedValue}`, ephemeral: true });
  }

  // กรณีเลือกปุ่ม Reset
  if (interaction.isButton() && interaction.customId === 'reset_dropdown') {
    await interaction.update({
      content: 'ล้างตัวเลือกเรียบร้อยแล้ว',
      components: createMenuDropdown()
    });
  }
};


module.exports = { createMenuEmbed, createMenuDropdown, handleInteraction };
