// GET /finance/reminders without token → 401
// owner can create an absolute reminder → 201
// absolute reminder without remindAt → 400
// bill offset reminder without billId → 400
// bill offset reminder without offsetDays → 400
// linked foreign bill → 400
// owner can fetch own reminder by id → 200
// other user cannot fetch reminder by id → 404