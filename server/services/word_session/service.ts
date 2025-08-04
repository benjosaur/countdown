// Get word index
// - Load in baseline of top 1000 & baseline bucket sums & baseline sum.
// - Load in DynamoDB bucket delta sum metadatas and overall delta sum metadata
// - Compute running dict of actual overall sum and bucket sums
// - Let sampledLikelihood = floor of math.random*overallLikelihoodSum
// - Find which bucket this lives in
// - Take sampledLikelihood - sum up to this bucket
// - Find which index this lives in
// - Generate puzzle for this word index.
// - Return puzzle and also append overall meta AND word data. (FE will display deltas that should mirror BE changes)

// Failed Submission
// Update Fail of Target.
//    - Update by Finding bucket index via baseline lookup via rank id

// Successful Submission
// Input 1. WordId/Rank 2. Submitted Word 3. As Primary or Secondary? 4. Record (Time or Fail)
// Possibilities (FE Should ensure anything submitted to BE is at least target word length AND valid from letter scramble)
// => 1. Submitted Word is NOT in dictionary
// => 2. Submitted Word IS in dictionary BUT NOT in tracked top 1000
// => 3. Submitted Word IS in dictionary AND in tracked top 1000 BUT NOT Target Word
// => 4. Submitted Word IS in dictionary AND in tracked top 1000 AND Target Word

// 1. Return Error
// 2. Return OK
// 3. Update SuccessIndirect10/Between10And20 in DDB Table. & Return OK
//    - Update by Finding bucket index via baseline lookup via rank id
// 4. Update Success10/SuccessBetween10And20 of Target.
//    - Update by Finding bucket index via baseline lookup via rank id

// All Success Table updates should include which anagram of the primary words was used
