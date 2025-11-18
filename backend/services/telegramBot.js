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
    // Only enable polling in production (Render), use webhook mode or disable locally
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
    
    bot = new TelegramBot(BOT_TOKEN, { 
      polling: isProduction ? {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      } : false 
    })
    
    if (isProduction) {
      console.log('✅ Telegram bot initialized with polling (Production)')
      
      // Handle polling errors gracefully
      bot.on('polling_error', (error) => {
        console.error('⚠️ Telegram polling error:', error.message)
        // Don't crash on polling errors, just log them
      })
    } else {
      console.log('✅ Telegram bot initialized without polling (Development - notifications only)')
    }

    // Handle callback queries (button clicks) - only if polling is enabled
    if (isProduction) {
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
            let order = await Order.findById(orderId).populate('userId', 'name email')
            if (!order) {
              await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'Order not found!',
                show_alert: true
              })
              return
            }

            // If shipped, prompt for delivery boy info and delivery time
            if (newStatus === 'Shipped') {
              await bot.sendMessage(msg.chat.id, '🚚 Please reply with the delivery boy name:', {
                reply_to_message_id: msg.message_id
              })
              bot.once('message', async (nameMsg) => {
                if (nameMsg.reply_to_message && nameMsg.reply_to_message.message_id === msg.message_id) {
                  const deliveryBoyName = nameMsg.text
                  await bot.sendMessage(msg.chat.id, '📱 Please reply with the delivery boy phone number:', {
                    reply_to_message_id: nameMsg.message_id
                  })
                  bot.once('message', async (phoneMsg) => {
                    if (phoneMsg.reply_to_message && phoneMsg.reply_to_message.message_id === nameMsg.message_id) {
                      const deliveryBoyPhone = phoneMsg.text
                      await bot.sendMessage(msg.chat.id, '⏰ Please reply with the expected delivery time (e.g. 5:30 PM):', {
                        reply_to_message_id: phoneMsg.message_id
                      })
                      bot.once('message', async (timeMsg) => {
                        if (timeMsg.reply_to_message && timeMsg.reply_to_message.message_id === phoneMsg.message_id) {
                          const deliveryTime = timeMsg.text
                          order.deliveryBoy = { name: deliveryBoyName, contact: deliveryBoyPhone }
                          order.estimatedDelivery = deliveryTime
                          await order.save()
                          await bot.sendMessage(msg.chat.id, `✅ Delivery info saved:\nName: ${deliveryBoyName}\nPhone: ${deliveryBoyPhone}\nTime: ${deliveryTime}`)
                          // Optionally, update the order message
                          const updatedMessage = formatOrderMessage(order)
                          await bot.editMessageText(updatedMessage, {
                            chat_id: msg.chat.id,
                            message_id: msg.message_id,
                            parse_mode: 'HTML',
                            reply_markup: {
                              inline_keyboard: getStatusButtons(orderId, newStatus)
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }

            // If cancelled, prompt for cancellation reason
            if (newStatus === 'Cancelled') {
              await bot.sendMessage(msg.chat.id, '❌ Please reply with the cancellation reason for this order:', {
                reply_to_message_id: msg.message_id
              })
              // Store context for awaiting reason
              bot.once('message', async (reasonMsg) => {
                if (reasonMsg.reply_to_message && reasonMsg.reply_to_message.message_id === msg.message_id) {
                  const reasonText = reasonMsg.text
                  order.cancellationReason = reasonText
                  await order.save()
                  await bot.sendMessage(msg.chat.id, `❌ Cancellation reason saved: ${reasonText}`)
                  // Optionally, update the order message
                  const updatedMessage = formatOrderMessage(order)
                  await bot.editMessageText(updatedMessage, {
                    chat_id: msg.chat.id,
                    message_id: msg.message_id,
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: getStatusButtons(orderId, newStatus)
                    }
                  })
                }
              })
            }

            // Update order status
            order.status = newStatus
            await order.save()

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
          }
        } catch (error) {
          console.error('Error handling callback query:', error)
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Error updating order status',
            show_alert: true
          })
        }
      })
    }

    // Handle text messages
    if (isProduction) {
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
            '<b>Available Commands:</b>\n' +
            '/sales_daily - View today\'s sales\n' +
            '/sales_weekly - View this week\'s sales\n' +
            '/sales_monthly - View this month\'s sales\n' +
            '/top_products - View best-selling products\n' +
            '/top_categories - View top categories\n\n' +
            `Your Chat ID: <code>${chatId}</code>`,
            { parse_mode: 'HTML' }
          )
        } else if (msg.text === '/sales_daily') {
          await sendSalesReport(chatId, 'daily')
        } else if (msg.text === '/sales_weekly') {
          await sendSalesReport(chatId, 'weekly')
        } else if (msg.text === '/sales_monthly') {
          await sendSalesReport(chatId, 'monthly')
        } else if (msg.text === '/top_products') {
          await sendTopProducts(chatId)
        } else if (msg.text === '/top_categories') {
          await sendTopCategories(chatId)
        }
      })
    }

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
🚚 <b>Delivery Charges:</b> ₹${order.deliveryCharges || 0}

${order.deliveryBoy?.name ? `🧑‍💼 <b>Delivery Boy:</b> ${order.deliveryBoy.name} (${order.deliveryBoy.contact || 'N/A'})` : ''}

📍 <b>Shipping Address:</b>
${order.shippingAddress.fullName}
${order.shippingAddress.phone}
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}

${order.cancellationReason ? `❌ <b>Cancellation Reason:</b> ${order.cancellationReason}` : ''}

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

// Send sales report
const sendSalesReport = async (chatId, period) => {
  if (!bot) return

  try {
    const now = new Date()
    let startDate

    if (period === 'daily') {
      startDate = new Date(now.setHours(0, 0, 0, 0))
    } else if (period === 'weekly') {
      startDate = new Date(now.setDate(now.getDate() - 7))
    } else if (period === 'monthly') {
      startDate = new Date(now.setMonth(now.getMonth() - 1))
    }

    const orders = await Order.find({
      orderDate: { $gte: startDate },
      status: { $ne: 'Cancelled' }
    })

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    const periodLabel = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month'
    }

    const message = `
📊 <b>${periodLabel[period]}'s Sales Report</b>

💰 Total Sales: ₹${totalSales.toFixed(2)}
📦 Total Orders: ${totalOrders}
📈 Avg Order Value: ₹${avgOrderValue.toFixed(2)}

📅 Period: ${startDate.toLocaleDateString('en-IN')} - ${new Date().toLocaleDateString('en-IN')}
`.trim()

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Error sending sales report:', error)
    await bot.sendMessage(chatId, '❌ Error generating sales report')
  }
}

// Send top products
const sendTopProducts = async (chatId) => {
  if (!bot) return

  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } })
    
    const productSales = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          }
        }
        productSales[item.name].quantity += item.quantity
        productSales[item.name].revenue += item.price * item.quantity
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    if (topProducts.length === 0) {
      await bot.sendMessage(chatId, '📦 No product sales data available yet')
      return
    }

    const productList = topProducts.map((p, i) => 
      `${i + 1}. ${p.name}\n   📊 Qty: ${p.quantity} | 💰 Revenue: ₹${p.revenue.toFixed(2)}`
    ).join('\n\n')

    const message = `
🏆 <b>Top Selling Products</b>

${productList}
`.trim()

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Error sending top products:', error)
    await bot.sendMessage(chatId, '❌ Error generating top products report')
  }
}

// Send top categories
const sendTopCategories = async (chatId) => {
  if (!bot) return

  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } }).populate({
      path: 'items.productId',
      select: 'category'
    })

    const categorySales = {}
    
    for (const order of orders) {
      for (const item of order.items) {
        // Try to get category from populated productId
        let category = 'Uncategorized'
        
        if (item.productId && item.productId.category) {
          category = item.productId.category
        }

        if (!categorySales[category]) {
          categorySales[category] = {
            name: category,
            quantity: 0,
            revenue: 0,
            orders: 0
          }
        }
        categorySales[category].quantity += item.quantity
        categorySales[category].revenue += item.price * item.quantity
      }
    }

    // Count unique orders per category
    for (const order of orders) {
      const categories = new Set()
      for (const item of order.items) {
        const category = item.productId?.category || 'Uncategorized'
        categories.add(category)
      }
      categories.forEach(cat => {
        if (categorySales[cat]) {
          categorySales[cat].orders++
        }
      })
    }

    const topCategories = Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    if (topCategories.length === 0) {
      await bot.sendMessage(chatId, '📁 No category sales data available yet')
      return
    }

    const categoryList = topCategories.map((c, i) => 
      `${i + 1}. ${c.name}\n   📦 Items: ${c.quantity} | 🛒 Orders: ${c.orders} | 💰 Revenue: ₹${c.revenue.toFixed(2)}`
    ).join('\n\n')

    const message = `
📁 <b>Top Selling Categories</b>

${categoryList}
`.trim()

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
  } catch (error) {
    console.error('Error sending top categories:', error)
    await bot.sendMessage(chatId, '❌ Error generating top categories report')
  }
}

module.exports = {
  initBot,
  sendOrderNotification,
  sendStatusUpdate
}
