const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuOptionBuilder } = require('discord.js');

// --- สร้าง Embed Message ---
const createMenuEmbed = () => {
  return new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('บริการต่างๆ')
    .setDescription('กรุณาเลือกเมนูที่ต้องการจาก Dropdown ด้านล่าง:')
    .setImage('https://www.craiyon.com/pt/image/GmCvgfvIQ9u2BXClxXtwuQ')
    .setTimestamp()
    .setFooter({ text: '© BOT By. Ped' });
};

// --- สร้าง Dropdown Menu ---
const createMenuDropdown = () => {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('main_menu_select')
    .setPlaceholder('เลือกบริการได้เลย')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('จ้างฟาม').setValue('Farm').setDescription('บริการจ้างฟาร์ม'),
      new StringSelectMenuOptionBuilder().setLabel('ซื้อของ').setValue('Item').setDescription('ซื้อไอเทมทั่วไป'),
      new StringSelectMenuOptionBuilder().setLabel('ซื้อตระกูล').setValue('Bloodline').setDescription('ซื้อสายเลือด/ตระกูล'),
      new StringSelectMenuOptionBuilder().setLabel('พ่อค้าโตโต้').setValue('Trade_1').setDescription('ติดต่อพ่อค้าโตโต้'),
    );

  const resetButton = new ButtonBuilder()
    .setCustomId('reset_dropdown')
    .setLabel('รีเซ็ตการเลือก')
    .setStyle(ButtonStyle.Danger);

  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(resetButton);

  return [row1, row2];
};

// --- จัดการ Interaction ---
const handleInteraction = async (interaction) => {
  try {
    // กรณีเลือกจาก Dropdown
    if (interaction.isStringSelectMenu() && interaction.customId === 'main_menu_select') {
      const selectedValue = interaction.values[0];

      // อัปเดต Dropdown ให้กลับเป็นสถานะว่าง (Reset UI)
      await interaction.update({ 
        components: createMenuDropdown() 
      });

      // ส่งข้อความแจ้งเตือนส่วนตัว (Ephemeral)
      await interaction.followUp({ 
        content: `✅ คุณได้เลือกเมนู: **${selectedValue}** เรียบร้อยแล้ว!`, 
        ephemeral: true 
      });
    }

    // กรณีเลือกปุ่ม Reset
    if (interaction.isButton() && interaction.customId === 'reset_dropdown') {
      await interaction.update({
        // เราส่ง Embed กลับไปเพื่อให้หน้าตาเหมือนเดิม ไม่ถูกแทนที่ด้วยข้อความ Content
        embeds: [createMenuEmbed()], 
        components: createMenuDropdown()
      });
    }
  } catch (error) {
    console.error('Interaction Error:', error);
    // ตรวจสอบว่าได้ตอบกลับไปหรือยัง ถ้ายังให้ Reply ถ้าตอบไปแล้วให้ FollowUp
    const errorMsg = { content: 'เกิดข้อผิดพลาดในการประมวลผล!', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
};

module.exports = { createMenuEmbed, createMenuDropdown, handleInteraction };