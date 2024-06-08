const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user.role === 'admin';
    } catch (error) {
        return false;
    }
}

router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if(! await checkAdminRole(req.user.id)) return res.status(403).json({error: 'User does not have admin role'});

        const data = req.body;
        const newCandidate = new Candidate(data);

        const response = await newCandidate.save();
        res.status(201).json({response: response});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if(!(checkAdminRole(req.body.id))) return res.status(403).json({error: 'User does not have admin role'});

        const candidateId = req.params.candidateId;
        const updatedCandidateData = req.body;

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true,
            runValidators: true
        })

        if(!response) {
            return res.status(404).json({error: 'Candidate not found'});
        }
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if(!(checkAdminRole(req.body.id))) return res.status(403).json({error: 'User does not have admin role'});

        const candidateId = req.params.candidateId;
        const response = await Candidate.findByIdAndDelete(candidateId);

        if(!response) {
            return res.status(404).json({error: 'Candidate not found'});
        }
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.post('/vote/:candidateId', jwtAuthMiddleware, async(req, res) => {
    const candidateId = req.params.candidateId;
    const userId = req.user.id;
    try {
        const candidate = await Candidate.findById(candidateId);
        if(!candidate) {
            return res.status(404).json({error: 'Candidate not found'});
        }

        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({error: 'User not found'});
        }
        if(user.isVoted) {
            return res.status(400).json({error: 'User has already voted'});
        }
        if(user.role === 'admin') {
            return res.status(403).json({error: 'Admin is not allowed to vote'});
        }

        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();
        
        user.isVoted = true;
        await user.save();
        res.status(200).json({message: 'Vote recorded successfully'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/vote/count', async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({voteCount: 'desc'});
        const voteRecord = candidates.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
        });
        return res.status(200).json(voteRecord);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find({}, 'name party -_id');
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;