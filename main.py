import discord
from discord.ext import commands
import yt_dlp
import os


intents = discord.Intents.all()

bot = commands.Bot(
    command_prefix="m!",
    intents=intents
)


ytdl = yt_dlp.YoutubeDL({
    "format": "bestaudio/best",
    "quiet": True,
    "noplaylist": True
})


def search_song(query):
    info = ytdl.extract_info(
        f"ytsearch:{query}",
        download=False
    )
    return info["entries"][0]


class SearchModal(discord.ui.Modal, title="🎵 חיפוש שיר"):

    song = discord.ui.TextInput(
        label="רשום שם שיר",
        placeholder="לדוגמה: עומר אדם",
        required=True
    )


    async def on_submit(self, interaction: discord.Interaction):

        if not interaction.user.voice:
            await interaction.response.send_message(
                "❌ אתה חייב להיות בוויס",
                ephemeral=True
            )
            return


        await interaction.response.defer()


        try:

            channel = interaction.user.voice.channel

            vc = interaction.guild.voice_client


            if not vc:
                vc = await channel.connect()
            else:
                await vc.move_to(channel)


            song = search_song(self.song.value)

            url = song["url"]
            title = song["title"]


            if vc.is_playing():
                vc.stop()


            source = discord.FFmpegPCMAudio(
                url,
                options="-vn"
            )


            vc.play(source)


            await interaction.followup.send(
                f"▶ מנגן עכשיו: **{title}**"
            )


        except Exception as e:

            await interaction.followup.send(
                f"❌ שגיאה:\n{e}"
            )



class MusicPanel(discord.ui.View):

    def __init__(self):
        super().__init__(timeout=None)



    @discord.ui.button(
        label="🔎 חפש שיר",
        style=discord.ButtonStyle.primary
    )
    async def search(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):
        await interaction.response.send_modal(SearchModal())



    @discord.ui.button(
        label="⏸ השהה",
        style=discord.ButtonStyle.secondary
    )
    async def pause(
        self,
        interaction,
        button
    ):

        vc = interaction.guild.voice_client

        if vc and vc.is_playing():
            vc.pause()
            await interaction.response.send_message(
                "⏸ הושהה",
                ephemeral=True
            )
        else:
            await interaction.response.send_message(
                "אין שיר",
                ephemeral=True
            )



    @discord.ui.button(
        label="▶ המשך",
        style=discord.ButtonStyle.success
    )
    async def resume(
        self,
        interaction,
        button
    ):

        vc = interaction.guild.voice_client

        if vc and vc.is_paused():
            vc.resume()
            await interaction.response.send_message(
                "▶ ממשיך",
                ephemeral=True
            )
        else:
            await interaction.response.send_message(
                "אין שיר בהשהיה",
                ephemeral=True
            )



    @discord.ui.button(
        label="⏭ דלג",
        style=discord.ButtonStyle.primary
    )
    async def skip(
        self,
        interaction,
        button
    ):

        vc = interaction.guild.voice_client

        if vc:
            vc.stop()

        await interaction.response.send_message(
            "⏭ דילגתי",
            ephemeral=True
        )



    @discord.ui.button(
        label="⛔ עצור",
        style=discord.ButtonStyle.danger
    )
    async def stop(
        self,
        interaction,
        button
    ):

        vc = interaction.guild.voice_client

        if vc:
            await vc.disconnect()

        await interaction.response.send_message(
            "⛔ עצרתי",
            ephemeral=True
        )



@bot.command()
async def p(ctx):

    embed = discord.Embed(
        title="🎵 Music Panel",
        description="בחר פעולה",
        color=0x00ff00
    )


    await ctx.send(
        embed=embed,
        view=MusicPanel()
    )



@bot.event
async def on_ready():
    print("Bot Online")



bot.run(os.getenv("TOKEN"))
