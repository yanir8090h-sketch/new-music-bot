const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { DisTube } = require('distube');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const distube = new DisTube(client, {
    leaveOnEmpty: true,
    leaveOnFinish: false,
    emitNewSongOnly: true,
});

const PREFIX = '!'; 

client.once('ready', () => {
    console.log(`🤖 הבוט מוכן ומעודכן סופית לפאנל נסתר! מחובר בתור: ${client.user.tag}`);
});

// פקודת Setup ששולחת את התפריט הציבורי שכולם רואים
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setup') {
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

// ניהול האינטראקציות
client.on('interactionCreate', async (interaction) => {
    const queue = distube.getQueue(interaction.guildId);

    // 1. כאשר משתמש בוחר אפשרות בתפריט הנפתח הציבורי
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_panel_style') {
        const selectedValue = interaction.values;

        // חובה להודיע לדיסקורד מיד כדי למנוע את השגיאה האדומה באופן מיידי!
        await interaction.deferReply({ ephemeral: true });

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
            
            // שולח את התשובה ששמרנו מראש בתוך ההודעה הפרטית
            return await interaction.editReply({ embeds: [embedSimple], components: [rowBtns] });
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
            
            // שולח את התשובה ששמרנו מראש בתוך ההודעה הפרטית
            return await interaction.editReply({ embeds: [embedAdvanced], components: [rowBtns2] });
        }
    }

    // 2. טיפול בלחיצות על כפתורי השליטה בתוך הפאנל הנסתר
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

        // שימוש ב-deferUpdate עבור שאר הכפתורים כדי לעדכן בצורה חלקה בתוך הממשק הנסתר
        await interaction.deferUpdate();

        if (interaction.customId === 'btn_pause' || interaction.customId === 'btn_adv_pause') {
            if (!queue) return;
            if (queue.paused) {
                distube.resume(interaction.guildId);
            } else {
                distube.pause(interaction.guildId);
            }
        }

        if (interaction.customId === 'btn_adv_resume') {
            if (!queue || !queue.paused) return;
            distube.resume(interaction.guildId);
        }

        if (interaction.customId === 'btn_skip' || interaction.customId === 'btn_adv_next') {
            if (!queue) return;
            try {
                await distube.skip(interaction.guildId);
            } catch (e) {
                console.log("אין עוד שירים");
            }
        }

        if (interaction.customId === 'btn_stop' || interaction.customId === 'btn_adv_clear_leave') {
            if (!queue) return;
            distube.stop(interaction.guildId);
        }
    }

    // 3. קבלת קלט מהחלון הקופץ והזרמת שיר
    if (interaction.isModalSubmit() && interaction.customId === 'music_play_modal') {
        const songName = interaction.fields.getTextInputValue('song_name_input');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({ content: '❌ עליך להיכנס לחדר קולי קודם לכן!', ephemeral: true });
        }

        await interaction.reply({ content: `🔍 מחפש ומזרים מיוטיוב: **${songName}**...`, ephemeral: true });

        try {
            await distube.play(voiceChannel, songName, {
                textChannel: interaction.channel,
                member: interaction.member
            });
        } catch (error) {
            console.error(error);
        }
    }
});

// עדכונים ציבוריים בצ'אט
distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 מזרים עכשיו: **${song.name}** [${song.formattedDuration}]\nהופעל על ידי: ${song.user}`);
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send(`✅ התווסף לתור ההזרמה: **${song.name}**`);
});

client.login(process.env.TOKEN);
