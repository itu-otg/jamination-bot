import { AllFlowsPrecondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message, Snowflake, GuildMember } from 'discord.js';

export class JamManagerOnly extends AllFlowsPrecondition {
	#message = 'Bu komut sadece moderasyon ekibi tarafından kullanılabilir';

	public override async chatInputRun(interaction: CommandInteraction) {
		const res = await this.doTeamCheck(interaction.guildId!, interaction.member as GuildMember);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		const res = await this.doTeamCheck(interaction.guildId!, interaction.member as GuildMember);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	public override async messageRun(message: Message) {
		const res = await this.doTeamCheck(message.guildId!, message.member as GuildMember);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	private async doTeamCheck(guildID: Snowflake, member: GuildMember) {
		const guildSettings = await this.container.db.guildSettings.findFirst({
      where: {
        guildID: guildID,
      }
    })

    return member.roles.cache.has(guildSettings?.adminRoleID!)
		
	}
}

