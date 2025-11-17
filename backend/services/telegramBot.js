const TelegramBot = require('node-telegram-bot-api')
const Order = require('../models/Order')

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

let bot = null

// Initialize the bot
const initBot = () => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('⚠️ Telegram bot credentials not configured')
    return null
  }

  try {
    bot = new TelegramBot(BOT_TOKEN, { polling: true })
    console.log('✅ Telegram bot initialized successfully')

    // Handle callback queries (button clicks)
    bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message
      const data = callbackQuery.data

      try {
        // Parse callback data: format is "status_<orderId>_<newStatus>"
        if (data.startsWith('status_')) {
          const parts = data.split('_')
          const orderId = parts[1]
          const newStatus = parts[2]

          // Update order status in database
          const order = await Order.findByIdAndUpdate(
            orderId,
            { status: newStatus },
            { new: true }
          ).populate('userId', 'name email')

          if (order) {
            // Answer callback query
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: `Order status updated to ${newStatus}!`
            })

            // Edit the message to show updated status
            const updatedMessage = formatOrderMessage(order)
            await bot.editMessageText(updatedMessage, {
              chat_id: msg.chat.id,
              message_id: msg.message_id,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: getStatusButtons(orderId, newStatus)
              }
            })
          } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Order not found!',
              show_alert: true
            })
          }
        }
      } catch (error) {
        console.error('Error handling callback query:', error)
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Error updating order status',
          show_alert: true
        })
      }
    })

    // Handle text messages
    bot.on('message', async (msg) => {
      // Ignore callback query messages
      if (msg.text && !msg.text.startsWith('/')) {
        return
      }

      const chatId = msg.chat.id

      if (msg.text === '/start') {
        await bot.sendMessage(chatId, 
          '🛒 <b>Better Bite Order Notification Bot</b>\n\n' +
          'This bot will send you notifications when new orders are placed.\n' +
          'You can update order status directly from Telegram using the buttons.\n\n' +
          `Your Chat ID: <code>${chatId}</code>`,
          { parse_mode: 'HTML' }
        )
      }
    })

    return bot
  } catch (error) {
    console.error('Error initializing Telegram bot:', error)
    return null
  }
}

// Format order details for Telegram message
const formatOrderMessage = (order) => {
  const items = order.items.map(item => 
    `  • ${item.name} x${item.quantity} - ₹${item.price * item.quantity}`
  ).join('\n')

  const statusEmoji = {
    'Pending': '🟡',
    'Processing': '🔵',
    'Shipped': '🟣',
    'Delivered': '🟢',
    'Cancelled': '🔴'
  }

  return `
🛒 <b>NEW ORDER RECEIVED!</b>

📋 Order ID: <code>${order._id}</code>
${statusEmoji[order.status] || '⚪'} Status: <b>${order.status}</b>

👤 Customer: ${order.userId?.name || 'Unknown'}
📧 Email: ${order.userId?.email || 'N/A'}

📦 <b>Items:</b>
${items}

💰 <b>Total: ₹${order.total}</b>

📍 <b>Shipping Address:</b>
${order.shippingAddress.fullName}
${order.shippingAddress.phone}
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}

📅 Order Date: ${new Date(order.orderDate).toLocaleString('en-IN')}
`.trim()
}

// Generate inline keyboard buttons for order status
const getStatusButtons = (orderId, currentStatus) => {
  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  
  // Create buttons in rows (2 buttons per row)
  const buttons = []
  for (let i = 0; i < statuses.length; i += 2) {
    const row = []
    for (let j = i; j < Math.min(i + 2, statuses.length); j++) {
      const status = statuses[j]
      const emoji = status === currentStatus ? '✅' : ''
      row.push({
        text: `${emoji} ${status}`,
        callback_data: `status_${orderId}_${status}`
      })
    }
    buttons.push(row)
  }

  return buttons
}

// Send order notification to Telegram
const sendOrderNotification = async (order) => {
  if (!bot || !CHAT_ID) {
    console.log('⚠️ Telegram bot not configured, skipping notification')
    return
  }

  try {
    const message = formatOrderMessage(order)
    const keyboard = getStatusButtons(order._id.toString(), order.status)

    await bot.sendMessage(CHAT_ID, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboard
      }
    })

    console.log(`✅ Order notification sent to Telegram for order ${order._id}`)
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
  }
}

// Send status update notification
const sendStatusUpdate = async (order, oldStatus) => {
  if (!bot || !CHAT_ID) {
    return
  }

  try {
    const statusEmoji = {
      'Pending': '🟡',
      'Processing': '🔵',
      'Shipped': '🟣',
      'Delivered': '🟢',
      'Cancelled': '🔴'
    }

    const message = `
📝 <b>ORDER STATUS UPDATED</b>

📋 Order ID: <code>${order._id}</code>
👤 Customer: ${order.userId?.name || 'Unknown'}

${statusEmoji[oldStatus] || '⚪'} ${oldStatus} → ${statusEmoji[order.status] || '⚪'} <b>${order.status}</b>

💰 Total: ₹${order.total}
`.trim()

    await bot.sendMessage(CHAT_ID, message, {
      parse_mode: 'HTML'
    })
  } catch (error) {
    console.error('Error sending status update notification:', error)
  }
}

module.exports = {
  initBot,
  sendOrderNotification,
  sendStatusUpdate
}
