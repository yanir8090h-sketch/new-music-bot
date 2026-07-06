import discord
from discord.ext import commands
import yt_dlp
import asyncio

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix="m!", intents=intents)


YTDL_OPTIONS = {
    "format": "bestaudio/best",
    "quiet": True,
    "noplaylist": True
}

FFMPEG_OPTIONS = {
    "options": "-vn"
}


class MusicPanel(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)


    @discord.ui.button(label="🎵 נגן שיר", style=discord.ButtonStyle.green)
    async def play(self, interaction: discord.Interaction, button):

        await interaction.response.send_message(
            "🎶 כתוב את שם השיר:",
            ephemeral=True
        )

        def check(msg):
            return (
                msg.author == interaction.user
                and msg.channel == interaction.channel
            )

        try:
            msg = await bot.wait_for(
                "message",
                check=check,
                timeout=60
            )

            if not interaction.user.voice:
                await interaction.followup.send(
                    "❌ אתה חייב להיות בוויס"
                )
                return


            voice = interaction.user.voice.channel

            vc = interaction.guild.voice_client

            if not vc:
                vc = await voice.connect(
                    timeout=60,
                    reconnect=True
                )


            search = f"ytsearch1:{msg.content}"


            with yt_dlp.YoutubeDL(YTDL_OPTIONS) as ydl:

                info = ydl.extract_info(
                    search,
                    download=False
                )

                if "entries" not in info:
                    await interaction.followup.send(
                        "❌ לא מצאתי שיר"
                    )
                    return

                song = info["entries"][0]

                url = song["url"]
                title = song["title"]


            if vc.is_playing():
                vc.stop()


            audio = discord.FFmpegPCMAudio(
                url,
                **FFMPEG_OPTIONS
            )

            vc.play(audio)


            await interaction.followup.send(
                f"🎵 מנגן עכשיו: **{title}**"
            )


        except asyncio.TimeoutError:
            await interaction.followup.send(
                "⌛ נגמר הזמן"
            )



    @discord.ui.button(label="⏸ השהה", style=discord.ButtonStyle.blurple)
    async def pause(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc and vc.is_playing():
            vc.pause()
            await interaction.response.send_message("⏸ הושהה")
        else:
            await interaction.response.send_message("אין שיר")



    @discord.ui.button(label="▶ המשך", style=discord.ButtonStyle.green)
    async def resume(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc and vc.is_paused():
            vc.resume()
            await interaction.response.send_message("▶ המשכתי")
        else:
            await interaction.response.send_message("אין שיר מושהה")



    @discord.ui.button(label="⏭ דלג", style=discord.ButtonStyle.gray)
    async def skip(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc:
            vc.stop()

        await interaction.response.send_message("⏭ דילגתי")



    @discord.ui.button(label="⛔ עצור", style=discord.ButtonStyle.red)
    async def stop(self, interaction, button):

        vc = interaction.guild.voice_client

        if vc:
            await vc.disconnect()

        await interaction.response.send_message("⛔ עצרתי")



@bot.command()
async def p(ctx):

    embed = discord.Embed(
        title="🎵 Music Player",
        description="לחץ על נגן וכתוב שם של שיר",
        color=discord.Color.blue()
    )

    await ctx.send(
        embed=embed,
        view=MusicPanel()
    )


@bot.event
async def on_ready():
    print(f"מחובר בתור {bot.user}")


bot.run("הטוקן שלך")
