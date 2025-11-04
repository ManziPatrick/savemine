const Agenda = require('agenda');
const Reminder = require('../models/Reminder');
const Loan = require('../models/Loan');
const Contact = require('../models/Contact');
const messageService = require('./messageService.mista');

class ScheduleService {
  constructor() {
    this.agenda = new Agenda({
      db: { address: process.env.MONGODB_URI },
      processEvery: '30 seconds',
      maxConcurrency: 20
    });

    this.setupJobs();
  }

  setupJobs() {
    // Define reminder job
    this.agenda.define('process reminder', async (job) => {
      const { reminderId } = job.attrs.data;
      
      try {
        const reminder = await Reminder.findById(reminderId)
          .populate('modelId')
          .populate('userId');

        if (!reminder || !reminder.isActive || reminder.status !== 'scheduled') {
          return;
        }

        console.log(`Processing reminder: ${reminder.title} for user: ${reminder.userId.email}`);

        // Get contact information
        let contact = null;
        let messageData = {};

        if (reminder.modelType === 'loan') {
          const loan = await Loan.findById(reminder.modelId).populate('contactId');
          if (loan && loan.contactId) {
            contact = loan.contactId;
            messageData = {
              contactName: contact.name,
              amount: loan.formattedAmount,
              dueDate: loan.dueDate.toLocaleDateString(),
              remainingAmount: loan.formattedRemainingAmount,
              daysUntilDue: loan.daysUntilDue
            };
          }
        } else if (reminder.modelType === 'custom') {
          // For custom reminders, try to extract phone from message template
          const phoneMatch = reminder.messageTemplate.match(/\+?[1-9]\d{1,14}/);
          if (phoneMatch) {
            contact = { phone: phoneMatch[0] };
          }
        }

        if (!contact || !contact.phone) {
          console.log(`No contact phone available for reminder: ${reminder.title}`);
          await reminder.markAsSent('sms', null, 'No contact phone available');
          return;
        }

        // Process message template
        const message = reminder.processTemplate(messageData);

        // Send message via configured channels
        const results = {};
        
        for (const channel of reminder.channels) {
          try {
            if (channel === 'sms') {
              results.sms = await messageService.sendSMS(contact.phone, message);
            } else if (channel === 'whatsapp') {
              results.whatsapp = await messageService.sendWhatsApp(contact.phone, message);
            }
            
            console.log(`Reminder sent via ${channel} to ${contact.phone}`);
            
          } catch (error) {
            console.error(`Failed to send reminder via ${channel}:`, error.message);
            results[channel] = { success: false, error: error.message };
          }
        }

        // Check if any channel succeeded
        const hasSuccess = Object.values(results).some(result => result.success);
        
        if (hasSuccess) {
          console.log(`Reminder sent successfully: ${reminder.title}`);
        } else {
          console.log(`Failed to send reminder: ${reminder.title}`);
        }

      } catch (error) {
        console.error('Error processing reminder:', error);
      }
    });

    // Define overdue loan check job
    this.agenda.define('check overdue loans', async (job) => {
      try {
        console.log('Checking for overdue loans...');
        
        const overdueLoans = await Loan.findOverdue();
        
        if (overdueLoans.length > 0) {
          console.log(`Found ${overdueLoans.length} overdue loans`);
          
          for (const loan of overdueLoans) {
            await loan.checkOverdue();
            console.log(`Updated loan ${loan._id} status to overdue`);
          }
        }
        
      } catch (error) {
        console.error('Error checking overdue loans:', error);
      }
    });

    // Define daily summary job
    this.agenda.define('daily summary', async (job) => {
      try {
        console.log('Generating daily summary...');
        
        // Get all active users
        const User = require('../models/User');
        const users = await User.find({ isActive: true });
        
        for (const user of users) {
          try {
            // Get user's outstanding loans
            const outstandingLoans = await Loan.find({
              userId: user._id,
              status: { $in: ['active', 'overdue'] }
            }).populate('contactId', 'name phone');

            if (outstandingLoans.length > 0) {
              // Get loans due soon (within 3 days)
              const dueSoon = outstandingLoans.filter(loan => {
                const daysUntilDue = loan.daysUntilDue;
                return daysUntilDue <= 3 && daysUntilDue >= 0;
              });

              if (dueSoon.length > 0) {
                // Send summary SMS if user has phone
                const summary = `Daily Summary - ${outstandingLoans.length} outstanding loans, ${dueSoon.length} due soon. Check SmartMoney app for details.`;
                
                try {
                  await messageService.sendSMS(user.phone, summary);
                  console.log(`Daily summary sent to ${user.email}`);
                } catch (error) {
                  console.log(`Failed to send daily summary to ${user.email}:`, error.message);
                }
              }
            }
            
          } catch (error) {
            console.error(`Error processing daily summary for user ${user.email}:`, error);
          }
        }
        
      } catch (error) {
        console.error('Error generating daily summary:', error);
      }
    });
  }

  async start() {
    try {
      await this.agenda.start();
      console.log('Schedule service started');

      // Schedule recurring jobs
      await this.scheduleRecurringJobs();
      
      // Load and schedule existing reminders
      await this.loadExistingReminders();

    } catch (error) {
      console.error('Failed to start schedule service:', error);
    }
  }

  async scheduleRecurringJobs() {
    // Schedule overdue loan check every hour
    await this.agenda.every('0 * * * *', 'check overdue loans');
    console.log('Scheduled overdue loan check job');

    // Schedule daily summary at 9 AM every day
    await this.agenda.every('0 9 * * *', 'daily summary');
    console.log('Scheduled daily summary job');
  }

  async loadExistingReminders() {
    try {
      console.log('Loading existing reminders...');
      
      const reminders = await Reminder.find({
        status: 'scheduled',
        isActive: true,
        sendAt: { $gte: new Date() }
      });

      console.log(`Found ${reminders.length} existing reminders`);

      for (const reminder of reminders) {
        await this.scheduleReminder(reminder);
      }

    } catch (error) {
      console.error('Error loading existing reminders:', error);
    }
  }

  async scheduleReminder(reminder) {
    try {
      const jobName = `reminder-${reminder._id}`;
      
      // Remove existing job if it exists
      await this.agenda.cancel({ name: jobName });
      
      // Schedule new job
      await this.agenda.schedule(reminder.sendAt, jobName, 'process reminder', {
        reminderId: reminder._id
      });
      
      console.log(`Scheduled reminder: ${reminder.title} for ${reminder.sendAt}`);
      
    } catch (error) {
      console.error(`Error scheduling reminder ${reminder._id}:`, error);
    }
  }

  async cancelReminder(reminderId) {
    try {
      const jobName = `reminder-${reminderId}`;
      await this.agenda.cancel({ name: jobName });
      console.log(`Cancelled reminder job: ${jobName}`);
    } catch (error) {
      console.error(`Error cancelling reminder ${reminderId}:`, error);
    }
  }

  async stop() {
    try {
      await this.agenda.stop();
      console.log('Schedule service stopped');
    } catch (error) {
      console.error('Error stopping schedule service:', error);
    }
  }

  // Get agenda instance for direct access if needed
  getAgenda() {
    return this.agenda;
  }
}

// Create singleton instance
const scheduleService = new ScheduleService();

module.exports = scheduleService;


