import { ChatStyle, ChatSounds, Colors, type CommandExecInfo, Module, ModuleCommand, type Player, type Role, type Room } from "haxball-extended-room";

interface CommandInfo {
    name: string;
    desc?: string;
    usage: string;
    aliases?: string[];
    roles?: (Role | string)[];
}

interface ModuleInfo {
    name: string;
    commands: CommandInfo[];
}

class CommandFormatter {
    static formatCommandDetails(command: CommandInfo): string {
        const aliases = CommandFormatter.formatAliases(command.aliases);
        return `[PV] 🔧 Comando: ${command.name.toLowerCase()}\nDescrição: ${command.desc}\nUso: ${command.usage}\nAliases: ${aliases}`;
    }

    static formatAliases(aliases: string[] | undefined): string {
        return aliases?.sort().join(", ") || "Nenhum";
    }

    static formatModuleCommands(commands: CommandInfo[]): string {
        return commands.map(command => {
            const aliases = CommandFormatter.formatAliases(command.aliases);
            return `• ${command.name.toLowerCase()} \n${command.desc ? `Descrição: ${command.desc}\n` : ''}Uso: ${command.usage}\nAliases: ${aliases}`;
        }).join("\n\n");
    }
}

class CommandFinder {
    constructor(private room: Room) {}

    findCommand(commandName: string): CommandInfo | undefined {
        return this.room.commands.find(command =>
            command.name === commandName ||
            (command.aliases?.includes(commandName))
        );
    }

    findModuleWithCommand(commandName: string): ModuleInfo | undefined {
        const foundModule = this.room.modules.find(module =>
            module.commands.some(command =>
                command.name === commandName ||
                (command.aliases?.includes(commandName))
            )
        );

        return foundModule as ModuleInfo | undefined;
    }

    getAllCommandNames(): string[] {
        const commandNames = this.room.commands
            .filter((command) => command.desc)
            .map((command) => command.name.toLowerCase());

        for (const module of this.room.modules) {
            for (const command of module.commands) {
                if (command.desc && !commandNames.includes(command.name.toLowerCase())) {
                    commandNames.push(command.name.toLowerCase());
                }
            }
        }

        return commandNames.sort();
    }
}

class ResponseBuilder {
    static sendCommandDetails(player: Player, command: CommandInfo) {
        player.reply({
            message: CommandFormatter.formatCommandDetails(command),
            color: Colors.Orange,
            style: ChatStyle.Bold,
            sound: ChatSounds.Notification
        });
    }

    static sendModuleCommands(player: Player, commands: CommandInfo[]) {
        player.reply({
            message: `[PV] 🔧 Comando(s) do módulo:\n${CommandFormatter.formatModuleCommands(commands)}`,
            color: Colors.Orange,
            style: ChatStyle.Bold,
            sound: ChatSounds.Notification
        });
    }

    static sendCommandNotFound(player: Player, commandName: string) {
        player.reply({
            message: `[PV] ❌ O comando "${commandName.toLowerCase()}" não foi encontrado.`,
            color: Colors.Red,
            style: ChatStyle.Bold,
            sound: ChatSounds.Notification
        });
    }

    static sendAllCommands(player: Player, commands: string[]) {
        player.reply({
            message: `[PV] 📜 Lista de Comandos Disponíveis:\n\n${commands.join(", ")}\n\nUse !help [comando] para mais detalhes.`,
            color: Colors.LightBlue,
            style: ChatStyle.Bold,
            sound: ChatSounds.Notification
        });
    }
}

@Module
export class HelpModule {
    private readonly commandFinder: CommandFinder;

    constructor(room: Room) {
        this.commandFinder = new CommandFinder(room);
    }

    @ModuleCommand({
        aliases: ["ajuda", "comandos", "comando"],
        desc: "Lista todos os comandos disponíveis.",
        usage: "[comando]",
        roles: [],
        deleteMessage: true,
    })
    public help(execInfo: CommandExecInfo) {
        const commandCalled = execInfo.arguments[0]?.toString().toLowerCase();
        const playerRole = execInfo.player.settings.role;
        const isAdmin = execInfo.player.admin;

        if (!commandCalled) {
            this.handleAllCommands(execInfo.player, playerRole, isAdmin);
            return;
        }

        this.handleSpecificCommand(execInfo.player, commandCalled, playerRole, isAdmin);
    }

    private handleAllCommands(player: Player, playerRole: string, isAdmin: boolean) {
        const allCommands = this.commandFinder.getAllCommandNames();
        const filteredCommands = this.filterCommandsByRole(allCommands, playerRole, isAdmin);
        ResponseBuilder.sendAllCommands(player, filteredCommands);
    }

    private handleSpecificCommand(player: Player, commandName: string, playerRole: string, isAdmin: boolean) {
        const command = this.commandFinder.findCommand(commandName);

        if (command) {
            if (!command.desc) {
                player.reply({
                    message: "[PV] ❌ Comando não encontrado.",
                    color: Colors.Red,
                    style: ChatStyle.Bold,
                    sound: ChatSounds.Notification
                });
                return;
            }
            if (this.isCommandAllowedForPlayer(command, playerRole, isAdmin)) {
                ResponseBuilder.sendCommandDetails(player, command);
            } else {
                player.reply({
                    message: "[PV] ❌ Você não tem permissão para ver esse comando.",
                    color: Colors.Red,
                    style: ChatStyle.Bold,
                    sound: ChatSounds.Notification
                });
            }
            return;
        }

        this.handleModuleCommand(player, commandName, playerRole, isAdmin);
    }

    private handleModuleCommand(player: Player, commandName: string, playerRole: string, isAdmin: boolean) {
        const module = this.commandFinder.findModuleWithCommand(commandName);

        if (!module) {
            ResponseBuilder.sendCommandNotFound(player, commandName);
            return;
        }

        const commands = module.commands.filter(cmd =>
            (cmd.name === commandName || (cmd.aliases?.includes(commandName))) &&
            this.isCommandAllowedForPlayer(cmd, playerRole, isAdmin)
        ).map(cmd => ({
            name: cmd.name,
            desc: cmd.desc,
            usage: cmd.usage,
            aliases: cmd.aliases
        }));

        if (commands.length > 0) {
            ResponseBuilder.sendModuleCommands(player, commands);
        } else {
            player.reply({
                message: "[PV] ❌ Nenhum comando disponível.",
                color: Colors.Red,
                style: ChatStyle.Bold,
                sound: ChatSounds.Notification
            });
        }
    }

    private isCommandAllowedForPlayer(command: CommandInfo, playerRole: string, isAdmin: boolean): boolean {
        if (command.roles?.includes('admin' as any) && isAdmin) {
            return true;
        }

        if (command.roles && command.roles.length > 0) {
            return command.roles.includes(playerRole as any);
        }

        return true;
    }

    private filterCommandsByRole(commands: string[], playerRole: string, isAdmin: boolean): string[] {
        return commands.filter(commandName => {
            const command = this.commandFinder.findCommand(commandName);
            return command && this.isCommandAllowedForPlayer(command, playerRole, isAdmin);
        });
    }
}
