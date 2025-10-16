import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'takım-oluştur',
	description: 'Takım oluşturmak için bu komutu kullanın!',
	preconditions: ['NotInTeam', 'GuildOnly']
})
export class UserCommand extends Command {
	#successEmbed = new EmbedBuilder()
		.setTitle(`Takım oluşturuldu!`)
		.setColor(0x7f91bd);

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((b) => b.setName('team-name').setDescription('Takım adı').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const teamName = interaction.options.getString('team-name');

    this.generateTeam(interaction, teamName!)

		return interaction.reply({ content: 'Hello world!' });
	}

	private async generateTeam(interaction: Command.ChatInputCommandInteraction, teamName: string) {
		const guildSettings = await this.container.db.guildSettings.findFirst({
			where: {
				guildID: interaction.guildId!
			}
		});

		if (!guildSettings) {
			return interaction.reply({
				content: 'Komutu kullanabilmek için önce jam modunun aktif olmasını beklemelisiniz.'
			});
		}
		if (!guildSettings.jamPositionateChannelID) {
			return interaction.reply({
				content: 'Komutu kullanabilmek için önce jam modunun aktif olmasını beklemelisiniz.'
			});
		}

		const resolvedChannel = await interaction.guild?.channels.fetch(guildSettings.jamPositionateChannelID);
		if (!resolvedChannel) {
			return interaction.reply({
				content: 'Komutu kullanabilmek için önce jam modunun aktif olmasını beklemelisiniz.'
			});
		}

		try {
			const category = await interaction.guild!.channels.create({
				name: teamName,
				type: ChannelType.GuildCategory,
				// @ts-ignore wtf man?
				position: resolvedChannel.position + 1,
				permissionOverwrites: [
					{
						id: interaction.guild!.roles.everyone.id,
						deny: [PermissionFlagsBits.ViewChannel]
					}
				]
			});

			if (!category) {
				return await interaction.reply({
					content: 'Takım kategorisi oluşturulurken bir hata oluştu. Moderatör desteği isteyin!'
				});
			}

			const textChannel = await interaction?.guild?.channels.create({
				name: `${teamName} - Assets`,
				type: ChannelType.GuildText,
				parent: category.id
			});

			const voice = await interaction?.guild?.channels.create({
				name: `${teamName} - Konuşma`,
				type: ChannelType.GuildVoice,
				parent: category.id,
				position: textChannel!.position + 1
			});

			if (!textChannel || !voice) {
				return await interaction.reply({ content: 'Takım kanallarını oluştururken bir hata oluştu, lütfen tekrar deneyin' });
			}

			const role = await interaction.guild!.roles.create({
				name: teamName,
				color: 'DarkPurple'
			});

			if (!role) {
				return await interaction.reply({ content: 'Takım rolünü oluştururken bir hata oluştu, lütfen tekrar deneyin' });
			}

			category.edit({
				permissionOverwrites: [
					{
						id: role.id,
						allow: [PermissionFlagsBits.ViewChannel]
					}
				]
			});

			const initialMember = { userID: interaction.user.id, role: "Takım Lideri"};

			this.container.db.jamTeam.create({
				data: {
					guildID: interaction.guildId!,
					name: teamName,
					categoryID: category.id,
					textChannelID: textChannel.id,
					voiceChannelID: voice.id,
					discordRoleID: role.id,
					members: {
						create: [
							{
								...initialMember,
								isTeamLeader: true
							}
						]
					}
				}
			});

			return await interaction.reply({ embeds: [
        this.#successEmbed.setDescription(`Takımınız ${teamName} başarıyla oluşturuldu!`)
      ] });
		} catch (error) {
			this.container.logger.error(error);
			return await interaction.reply('Bir hata oluştu, lütfen tekrar deneyin yada moderatör desteği isteyin!');
		}
	}
}
