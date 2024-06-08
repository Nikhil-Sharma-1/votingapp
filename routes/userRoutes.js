const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

router.post('/signup', async (req, res) => {
    try {
        const data = req.body;
        if(newUser.role === "admin") {
            if(User.findOne({role: "admin"})) {
                return res.status(400).json({error: 'There is one admin present already'});
            }
        } 
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        }
        // Checking if a user with the same Aadhar Card Number already exists
         const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
             return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
        }
        const newUser = new User(data);
        const response = await newUser.save();
        const payload = {
            id: response.id
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        res.status(201).json({response: response, token: token});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.post('/login', async (req, res) => {
    try {
        const {aadharCardNumber, password} = req.body;
        if (!aadharCardNumber || !password) {
            return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
        }
        const user = await User.findOne({aadharCardNumber})

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({error: 'Invalid username or password'});
        } 
        const payload = {
            id: user.id
        }

        const token = generateToken(payload);
        res.status(200).json({token})
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({user});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const {currentPassword, newPassword} = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        const user = await findById(userId);
        if(!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({error: 'Invalid password'});
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({message: 'Password updated'})
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

module.exports = router;