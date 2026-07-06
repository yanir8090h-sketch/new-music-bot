const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { generateDependencyReport } = require('@discordjs/voice');
console.log(generateDependencyReport());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.on('ready', () => {
    console.log(`✅ הבוט מחובר כעת בתור ${client.user.tag}`);
});

// פקודת טקסט רגילה לפתיחת הפאנל
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'הפאנל') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_music_modal')
                    .setLabel('🎧 הפעלת שיר / רדיו')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('cleanup_bot')
                    .setLabel('❌ ניקוי מחדש וניתוק')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({
            content: '🎵 **ברוכים הבאים לפאנל המוזיקה הרשמי** 🎵\nלחצו על הלחצנים למטה כדי לשלוט בבוט בצורה בטוחה:',
            components: [row]
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    // לחיצה על כפתור פתיחת חלונית השיר
    if (interaction.isButton() && interaction.customId === 'open_music_modal') {
        const modal = new ModalBuilder()
            .setCustomId('music_modal')
            .setTitle('Pop Hits Live 🎧');

        const songInput = new TextInputBuilder()
            .setCustomId('song_input')
            .setLabel('הקלידו את שם השיר או הזמר שברצונכם לשמוע:')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(songInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }

    // לחיצה על כפתור הניתוק והאיפוס
    if (interaction.isButton() && interaction.customId === 'cleanup_bot') {
        const voiceChannel = interaction.member.voice.channel;
        if (voiceChannel) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            connection.destroy();
            await interaction.reply({ content: '🧹 הבוט אופס ונותק בהצלחה מערוץ הקול!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ אתה חייב להיות בערוץ קול כדי לאפס את הבוט!', ephemeral: true });
        }
    }

    // קבלת שם השיר מהמודאל ונגינתו
    if (interaction.isModalSubmit() && interaction.customId === 'music_modal') {
        const songName = interaction.fields.getTextInputValue('song_input');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({ content: '❌ אתה חייב להיות בערוץ קול כדי להפעיל מוזיקה!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            
                       // חיפוש השיר ב-SoundCloud שעוקף את החסימות של יוטיוב בשרתים
           const play = require('play-dl');
let sc_info = await play.search(songName, { limit: 1, source: { soundcloud: 'tracks' } });
            if (!sc_info || sc_info.length === 0) {
                return await interaction.editReply({ content: '❌ לא מצאתי שיר בשם הזה!', ephemeral: true });
            }

            const track = sc_info.shift();
                        let stream = await play.stream(track.url);
            const resource = createAudioResource(stream.stream, {
                inlineVolume: true
            });








            connection.subscribe(player);
            player.play(resource);

          await interaction.editReply({ content: `🎶 הבוט מזרים כעת בהצלחה בחדר הקול את השיר: **${track.name}** מותאם בבטחה על ידי: ${interaction.user}`, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ אירעה שגיאה בהפעלת השיר!', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
