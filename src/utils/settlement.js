export function calculateSettlement(expenses, members) {
  const paid = {}
  const shouldPay = {}
  members.forEach(m => { paid[m] = 0; shouldPay[m] = 0 })

  expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0
    if (paid[exp.paidBy] !== undefined) paid[exp.paidBy] += amount
    const split = exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : members
    const perPerson = amount / split.length
    split.forEach(m => {
      if (shouldPay[m] !== undefined) shouldPay[m] += perPerson
    })
  })

  const balance = {}
  members.forEach(m => { balance[m] = paid[m] - shouldPay[m] })

  // Greedy algorithm to minimize number of transfers
  const creditors = members
    .filter(m => balance[m] > 0.5)
    .map(m => ({ name: m, amount: balance[m] }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = members
    .filter(m => balance[m] < -0.5)
    .map(m => ({ name: m, amount: -balance[m] }))
    .sort((a, b) => b.amount - a.amount)

  const transfers = []
  let ci = 0, di = 0
  while (di < debtors.length && ci < creditors.length) {
    const amount = Math.min(debtors[di].amount, creditors[ci].amount)
    transfers.push({
      from: debtors[di].name,
      to: creditors[ci].name,
      amount: Math.round(amount)
    })
    debtors[di].amount -= amount
    creditors[ci].amount -= amount
    if (debtors[di].amount < 0.5) di++
    if (creditors[ci].amount < 0.5) ci++
  }

  return { paid, shouldPay, balance, transfers }
}
