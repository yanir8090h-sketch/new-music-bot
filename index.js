const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '!'; 

client.once('ready', () => {
    console.log(`🤖 הבוט החדש מוכן ופועל! מחובר בתור: ${client.user.tag}`);
});

// פקודת Setup הציבורית שכולם רואים בערוץ
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

   if (command === 'panel') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🗃️ Master Control Panel')
            .setDescription('ברוך הבא לפאנל השליטה של בוט המוזיקה.\nפתח את התפריט למטה ובחר את סגנון השליטה המועדף עליך:');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_panel_style')
            .setPlaceholder('⚡ Advanced (Quick-Actions)')
            .addOptions([
                { 
                    label: 'Simple (User-Friendly)', 
                    description: 'פאנל שליטה בסיסי ונוח למשתמש', 
                    value: 'style_simple',
                    emoji: '🎵'
                },
                { 
                    label: 'Advanced (Quick-Actions)', 
                    description: 'פאנל פעולות מהירות לשליטה מלאה', 
                    value: 'style_advanced',
                    emoji: '⚡'
                },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await message.delete().catch(() => {}); 
        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// ניהול האינטראקציות - הפאנלים נשלחים כהודעה נסתרת (ephemeral) בלבד!
client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_panel_style') {
        const selectedValue = interaction.values;

        if (selectedValue === 'style_simple') {
            const embedSimple = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🎵 User Friendly Control Panel')
                .setDescription('לחץ על הכפתורים למטה כדי לשלוט במוזיקה בזמן אמת!');

            const playBtn = new ButtonBuilder().setCustomId('btn_play').setLabel('נגן שיר 🎶').setStyle(ButtonStyle.Success);
            const pauseBtn = new ButtonBuilder().setCustomId('btn_pause').setLabel('הפעל/השהה ⏸️').setStyle(ButtonStyle.Primary);
            const skipBtn = new ButtonBuilder().setCustomId('btn_skip').setLabel('דילוג ⏭️').setStyle(ButtonStyle.Secondary);
            const stopBtn = new ButtonBuilder().setCustomId('btn_stop').setLabel('עצור 🛑').setStyle(ButtonStyle.Danger);

            const rowBtns = new ActionRowBuilder().addComponents(playBtn, pauseBtn, skipBtn, stopBtn);
            
            // שליחת הנגן כהודעה פרטית חדשה לחלוטין למי שלחץ
            return await interaction.reply({ embeds: [embedSimple], components: [rowBtns], ephemeral: true });
        } 
        
        if (selectedValue === 'style_advanced') {
            const embedAdvanced = new EmbedBuilder()
                .setColor('#23a55a')
                .setTitle('⚡ Advanced Quick-Actions Panel')
                .setDescription('פעולות שליטה מתקדמות ומהירות בבוט');

            const playBtn2 = new ButtonBuilder().setCustomId('btn_adv_play').setLabel('חפש ונגן שיר 🎵').setStyle(ButtonStyle.Success);
            const pauseBtn2 = new ButtonBuilder().setCustomId('btn_adv_pause').setLabel('השהה ⏸️').setStyle(ButtonStyle.Secondary);
            const resumeBtn2 = new ButtonBuilder().setCustomId('btn_adv_resume').setLabel('המשך ▶️').setStyle(ButtonStyle.Success);
            const nextBtn2 = new ButtonBuilder().setCustomId('btn_adv_next').setLabel('הבא בתור ⏭️').setStyle(ButtonStyle.Primary);
            const clearLeaveBtn2 = new ButtonBuilder().setCustomId('btn_adv_clear_leave').setLabel('ניקוי תור וניתוק 🛑').setStyle(ButtonStyle.Danger);

            const rowBtns2 = new ActionRowBuilder().addComponents(playBtn2, pauseBtn2, resumeBtn2, nextBtn2, clearLeaveBtn2);
            
            // שליחת הנגן כהודעה פרטית חדשה לחלוטין למי שלחץ
            return await interaction.reply({ embeds: [embedAdvanced], components: [rowBtns2], ephemeral: true });
        }
    }

    // פתיחת חלונית חיפוש השיר (Modal)
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_play' || interaction.customId === 'btn_adv_play') {
            const modal = new ModalBuilder().setCustomId('music_play_modal').setTitle('🎵 הזרמת שיר בזמן אמת');
            const songInput = new TextInputBuilder()
                .setCustomId('song_name_input')
                .setLabel('הקש את שם השיר או קישור מיוטיוב:')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('לדוגמה: אושר כהן')
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(songInput);
            modal.addComponents(row);
            return await interaction.showModal(modal);
        }

        // שאר הכפתורים יחזירו אישור קטן ונסתר
        return await interaction.reply({ content: '🔘 הפקודה התקבלה במערכת!', ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId === 'music_play_modal') {
        const songName = interaction.fields.getTextInputValue('song_name_input');
        return await interaction.reply({ content: `🔍 מחפש ומנגן עבורך: **${songName}**`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
