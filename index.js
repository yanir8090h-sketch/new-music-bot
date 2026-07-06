import discord
from discord.ext import commands

bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())

# ==========================
# SELECT MENU
# ==========================

class MusicSelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(
                label="פאנל פשוט",
                description="פאנל בסיסי למשתמשים",
                emoji="🎵"
            ),
            discord.SelectOption(
                label="פאנל מתקדם",
                description="פאנל עם כל האפשרויות",
                emoji="⚡"
            )
        ]

        super().__init__(
            placeholder="בחר סוג פאנל...",
            min_values=1,
            max_values=1,
            options=options
        )

    async def callback(self, interaction: discord.Interaction):

        if self.values[0] == "פאנל פשוט":
            embed = discord.Embed(
                title="🎵 פאנל פשוט",
                description="בחרת בפאנל הפשוט.",
                color=discord.Color.green()
            )

        else:
            embed = discord.Embed(
                title="⚡ פאנל מתקדם",
                description="בחרת בפאנל המתקדם.",
                color=discord.Color.orange()
            )

        await interaction.response.edit_message(embed=embed, view=MusicView())


# ==========================
# BUTTONS
# ==========================

class MusicView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

        self.add_item(MusicSelect())

    @discord.ui.button(label="▶ נגן", style=discord.ButtonStyle.green)
    async def play(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("🎵 מתחיל לנגן...", ephemeral=True)

    @discord.ui.button(label="⏸ השהה", style=discord.ButtonStyle.blurple)
    async def pause(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⏸ השיר הושהה.", ephemeral=True)

    @discord.ui.button(label="⏭ דלג", style=discord.ButtonStyle.gray)
    async def skip(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⏭ דילגת על השיר.", ephemeral=True)

    @discord.ui.button(label="⏹ עצור", style=discord.ButtonStyle.red)
    async def stop(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⏹ המוזיקה נעצרה.", ephemeral=True)


# ==========================
# COMMAND
# ==========================

@bot.command()
@commands.has_permissions(administrator=True)
async def musicpanel(ctx):
    embed = discord.Embed(
        title="🎶 Music Control Panel",
        description="ברוכים הבאים לפאנל השירים.\nבחר מצב מהתפריט.",
        color=discord.Color.blue()
    )

    await ctx.send(embed=embed, view=MusicView())



import os

TOKEN = os.getenv("TOKEN")

if TOKEN is None:
    print("❌ לא נמצא TOKEN במשתני הסביבה.")
else:
    bot.run(TOKEN)
