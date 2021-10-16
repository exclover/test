const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalFollow, GoalPlaceBlock } = require('mineflayer-pathfinder').goals
const readline = require('readline');
const Vec3 = require('Vec3');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});



String.prototype.colors = function () {
  const colours = {
    "§r": "\x1b[0m",
    "§0": "\x1b[30m",
    "§1": "\x1b[34m",
    "§2": "\x1b[32m",
    "§3": "\x1b[36m",
    "§4": "\x1b[31m",
    "§5": "\x1b[35m",
    "§6": "\x1b[33m",
    "§7": "\x1b[37m",
    "§8": "\x1b[38m",
    "§9": "\x1b[1m\x1b[34m",
    "§a": "\x1b[1m\x1b[32m",
    "§b": "\x1b[1m\x1b[36m",
    "§c": "\x1b[1m\x1b[31m",
    "§d": "\x1b[1m\x1b[35m",
    "§e": "\x1b[1m\x1b[33m",
    "§f": "\x1b[1m\x1b[37m",
    "§g": "\x1b[1m\x1b[33m"
  };

  var re = new RegExp(Object.keys(colours).join("|"),"gi");

  return this.replace(re, function(matched){
      return colours[matched.toLowerCase()];
  });

};

module.exports = function (bot, options) {
  const cmds = () =>{
    rl.question('> ', input => {
      if (input == "list") {
        consoles("\x1b[1m\x1b[33mAktif Oyuncular:\x1b[0m "+Object.keys(bot.players));
      }else{
        bot.chat(input)
      }
      cmds();
    });
  }


  const consoles = (msg) =>{
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.log(msg);
      rl.prompt(true);
  }


  bot.loadPlugin(pathfinder)
  const tossAll = (done) => {
    const itemsQueue = bot.inventory.items().filter(item => !!item)
    const performToss = () => {
      const item = itemsQueue.pop()
      bot.tossStack(item, () => {
        if (itemsQueue.length === 0) return done()
        performToss()
      })
    }
    performToss()
  }


  const breaks = async (defaultMove,locations) => {
    bot.pathfinder.setMovements(defaultMove)
    for (var i = 0; i < locations.length; i++) {
      const items = bot.inventory.items().filter(item => item.slot === bot.getEquipmentDestSlot("hand"))[0]
      if (1561-items.nbt.value.Damage.value > 10) {
        var position = locations[i];
        await bot.pathfinder.goto(new GoalNear(position.x, position.y, position.z, 0), (m => {
          consoles("kırdım!")
        }));
      }else{
        break;
        consoles("kazma canı az!")
      }
    }
    bot.pathfinder.setGoal(null)
  };

  const goToSleep = (mcData) => {
    const bed = bot.findBlock({
      matching: mcData.blocksByName.white_bed.id
    })

    if (bed) {
      bot.sleep(bed, (err) => {
        if (err) {
          consoles("I can't sleep: "+err.message)
        } else {
          consoles("I'm sleeping")
        }
      })
    } else {
      consoles('No nearby bed')
    }
  }

  var spawn = 0;
  bot.on('spawn', async () => {
    if (options.commands && spawn == 0) {
      for (var i = 0; i < options.commands.length; i++) {
        bot.chat(options.commands[i])
      }
      spawn = 1;
    }
    await bot.waitForChunksToLoad();
  });

  bot.on('login', () => {
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    bot.on('message', m => {
      consoles(m.toMotd().colors())
      var mesaj = m.toString();
      if (mesaj.includes(" -> ben] ")) {
        const message = mesaj.split(" -> ben] ")
        const username = message[0].substring(1)
        const messages = message[1].split(" ")
        if (username === bot.username) return
        ///if (username != "exclover") return
        const target = bot.players[username] ? bot.players[username].entity : null
        switch (messages[0]) {
          /*case "test": {
            var name = messages[1];
            const ids = [mcData.blocksByName[name].id]
            const blocks = bot.findBlocks({ matching: ids, maxDistance: 128, count: 10 })
            const items = bot.inventory.items().filter(item => item.name.includes("_pickaxe"))
            bot.equip(items[0], "hand", () => {
              breaks(defaultMove, blocks);
            });
            break;
          }*/
          case "yat": {
            goToSleep(mcData)
            break;
          }
          
          case "tpa": {
            bot.chat("/tpa "+username)
            break;
          }
          case "gel": {
            if (!target) {
              bot.chat("/msg "+username+" seni göremiyorum!")
              return
            }
            bot.pathfinder.setMovements(defaultMove)
            //bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))
    
            bot.pathfinder.goto(new GoalNear(target.position.x, target.position.y, target.position.z, 0), (m => {
              bot.chat("/msg "+username+" geldim!")
            }));
            break;
          }
          case "takip": {
            if (!target) {
              bot.chat("/msg "+username+" seni göremiyorum!")
              return
            }
    
            bot.pathfinder.setMovements(defaultMove)
            bot.pathfinder.setGoal(new GoalFollow(target, 1), true)
            break;
          }
          case "git": {
            messages.splice(messages, 1);
            const cmd = messages
            if (cmd.length === 3) { // git x y z
              const x = parseInt(cmd[0], 10)
              const y = parseInt(cmd[1], 10)
              const z = parseInt(cmd[2], 10)
      
              bot.pathfinder.setMovements(defaultMove)
              bot.pathfinder.setGoal(new GoalBlock(x, y, z))
            } else if (cmd.length === 2) { // git x z
              const x = parseInt(cmd[0], 10)
              const z = parseInt(cmd[1], 10)
      
              bot.pathfinder.setMovements(defaultMove)
              bot.pathfinder.setGoal(new GoalXZ(x, z))
            } else if (cmd.length === 1) { // git y
              const y = parseInt(cmd[0], 10)
      
              bot.pathfinder.setMovements(defaultMove)
              bot.pathfinder.setGoal(new GoalY(y))
            }
            break;
          }
          case "dur": {
            bot.pathfinder.setGoal(null)
            break;
          }
          case "spawn": {
            bot.chat("/spawn")
            break;
          }
          case "at": {
            bot.lookAt(target.position.offset(0, 1.6, 0), false, () => {
              setTimeout(function(){
                tossAll(() => {
                  bot.chat("/msg "+username+" Tüm eşyaları atım!")
                })
              }, 350);
            })
            break;
          }
          default: {
            bot.chat(messages.join(" "))
          }
        }
      }else if(mesaj.includes(" sana bir ışınlanma isteği yolladı.")){
        var username = mesaj.replace(" sana bir ışınlanma isteği yolladı.", "");
        if (options.tpa.indexOf(username) > -1) {
          bot.chat("/tpaccept")
        }
      }
    })
    cmds();
  })
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  bot.on('end', async function () {
    await delay(options.rejoin*1000)
    const bot = mineflayer.createBot(options)
    bot.loadPlugin(require('./mods.js'))
  })
}
