const Contact = require('../models/Contact');
const Loan = require('../models/Loan');
const Dispatch = require('../models/Dispatch');
const MessageLog = require('../models/MessageLog');
const smsService = require('./smsService');
const { normalizePhone } = require('../utils/phone');
const { parsePhones } = require('./dispatchPhones');
const { advanceSendDate, repeats } = require('./dispatchSchedule');

const REASONS = ['loan', 'bill', 'gift', 'follow_up', 'general'];
const SCHEDULES = ['now', 'date', 'weekly', 'monthly', 'yearly'];

function personFromContact(contact) {
  return {
    contactId: contact._id,
    name: contact.name || '',
    phone: normalizePhone(contact.phone) || contact.phone || '',
    status: 'pending',
    error: ''
  };
}

async function peopleFor(userId, contactIds, loanId) {
  const ids = Array.isArray(contactIds) ? contactIds.filter(Boolean) : [];
  const contacts = ids.length
    ? await Contact.find({ _id: { $in: ids }, userId, isActive: true })
    : [];
  const people = contacts.map(personFromContact);
  if (loanId) {
    const loan = await Loan.findOne({ _id: loanId, userId, isActive: true }).populate('contactId', 'name phone');
    const borrower = loan && loan.contactId;
    if (borrower && !people.some((person) => String(person.contactId) === String(borrower._id))) {
      people.unshift(personFromContact(borrower));
    }
  }
  return people;
}

async function recordLog(dispatch, person, status, errorMessage) {
  await MessageLog.create({
    userId: dispatch.userId,
    dispatchId: dispatch._id,
    phone: person.phone || 'unknown',
    contactName: person.name,
    reason: dispatch.reason,
    message: dispatch.message,
    channel: 'sms',
    status,
    errorMessage: errorMessage || undefined,
    attempts: 1
  });
}

async function deliver(dispatch, { onlyUnsent = false } = {}) {
  let sent = 0;
  let failed = 0;
  for (const person of dispatch.recipients) {
    if (onlyUnsent && person.status === 'sent') continue;
    const phone = normalizePhone(person.phone);
    if (!phone) {
      person.status = 'failed';
      person.error = 'Add a phone number first';
      failed += 1;
      await recordLog(dispatch, person, 'failed', person.error);
      continue;
    }
    person.phone = phone;
    try {
      const result = await smsService.sendSMS(phone, dispatch.message);
      if (!result?.success) {
        const problems = Array.isArray(result?.details?.detail) ? result.details.detail : [];
        const fromProblems = problems.map((item) => item.msg).filter(Boolean).join('; ');
        const detail = fromProblems || result?.details?.message || result?.details?.error || result?.error || 'Could not send';
        throw new Error(typeof detail === 'string' ? detail : 'Could not send');
      }
      person.status = 'sent';
      person.sentAt = new Date();
      person.error = '';
      sent += 1;
      await recordLog(dispatch, person, 'sent');
    } catch (error) {
      person.status = 'failed';
      person.error = error.message || 'Could not send';
      failed += 1;
      await recordLog(dispatch, person, 'failed', person.error);
    }
  }

  dispatch.sentCount = (dispatch.sentCount || 0) + sent;
  if (repeats(dispatch.schedule)) {
    dispatch.recipients.forEach((person) => {
      person.status = 'pending';
      person.error = '';
    });
    dispatch.nextSendAt = advanceSendDate(dispatch.nextSendAt || new Date(), dispatch.schedule);
    dispatch.status = 'scheduled';
  } else {
    dispatch.nextSendAt = null;
    if (sent && failed) dispatch.status = 'partial';
    else if (failed) dispatch.status = 'failed';
    else dispatch.status = 'sent';
  }
  dispatch.markModified('recipients');
  await dispatch.save();
  return dispatch;
}

async function createDispatch(user, body) {
  const reason = REASONS.includes(body.reason) ? body.reason : 'general';
  const schedule = SCHEDULES.includes(body.schedule) ? body.schedule : 'now';
  const message = String(body.message || '').trim();
  if (!message) {
    const error = new Error('Write the message');
    error.statusCode = 400;
    throw error;
  }
  const people = await peopleFor(user._id, body.contactIds, reason === 'loan' ? body.loanId : null);
  const typed = parsePhones(body.phones);
  if (typed.rejected.length) {
    const error = new Error(`Could not use ${typed.rejected.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  typed.people.forEach((person) => {
    if (!people.some((existing) => existing.phone === person.phone)) people.push(person);
  });
  if (!people.length) {
    const error = new Error('Choose a person or type a number');
    error.statusCode = 400;
    throw error;
  }
  const when = body.scheduledDate ? new Date(body.scheduledDate) : new Date();
  if (schedule !== 'now' && Number.isNaN(when.getTime())) {
    const error = new Error('Choose the date');
    error.statusCode = 400;
    throw error;
  }

  const dispatch = await Dispatch.create({
    userId: user._id,
    reason,
    loanId: reason === 'loan' && body.loanId ? body.loanId : null,
    message,
    schedule,
    scheduledDate: schedule === 'now' ? new Date() : when,
    nextSendAt: schedule === 'now' ? new Date() : when,
    status: 'scheduled',
    recipients: people
  });

  if (schedule === 'now') return deliver(dispatch);
  return dispatch;
}

function plansFrom(body) {
  if (Array.isArray(body.plans) && body.plans.length) {
    return body.plans.map((plan) => ({
      message: plan.message,
      schedule: SCHEDULES.includes(plan.schedule) ? plan.schedule : (SCHEDULES.includes(body.schedule) ? body.schedule : 'date'),
      scheduledDate: plan.scheduledDate
    }));
  }
  return [{
    message: body.message,
    schedule: body.schedule,
    scheduledDate: body.scheduledDate
  }];
}

async function createPlans(user, body) {
  const plans = plansFrom(body);
  plans.forEach((plan) => {
    if (!String(plan.message || '').trim()) {
      const error = new Error('Write the message for each day');
      error.statusCode = 400;
      throw error;
    }
    const schedule = SCHEDULES.includes(plan.schedule) ? plan.schedule : 'now';
    if (schedule !== 'now' && Number.isNaN(new Date(plan.scheduledDate).getTime())) {
      const error = new Error('Choose the day');
      error.statusCode = 400;
      throw error;
    }
  });
  const created = [];
  for (const plan of plans) {
    created.push(await createDispatch(user, {
      ...body,
      message: plan.message,
      schedule: plan.schedule,
      scheduledDate: plan.scheduledDate,
      plans: undefined
    }));
  }
  return created;
}

async function resendDispatch(user, id) {
  const dispatch = await Dispatch.findOne({ _id: id, userId: user._id, isActive: true });
  if (!dispatch) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }
  const waiting = dispatch.recipients.some((person) => person.status !== 'sent');
  return deliver(dispatch, { onlyUnsent: waiting });
}

async function cancelDispatch(user, id) {
  const dispatch = await Dispatch.findOne({ _id: id, userId: user._id, isActive: true });
  if (!dispatch) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }
  dispatch.isActive = false;
  dispatch.nextSendAt = null;
  await dispatch.save();
  return dispatch;
}

async function sendDueDispatches(now = new Date()) {
  const due = await Dispatch.find({
    isActive: true,
    status: 'scheduled',
    nextSendAt: { $ne: null, $lte: now }
  });
  for (const dispatch of due) {
    try {
      await deliver(dispatch);
    } catch (error) {
      console.error('Scheduled message failed:', error.message);
    }
  }
  return { checked: due.length };
}

module.exports = { createDispatch, createPlans, resendDispatch, cancelDispatch, sendDueDispatches, deliver };
