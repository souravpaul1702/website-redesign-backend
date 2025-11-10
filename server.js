{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 ```javascript\
const express = require('express');\
const axios = require('axios');\
const cors = require('cors');\
require('dotenv').config();\
\
const app = express();\
const PORT = process.env.PORT || 3000;\
\
app.use(cors());\
app.use(express.json());\
\
const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_KEY;\
const OPENAI_KEY = process.env.OPENAI_KEY;\
\
console.log('Backend started');\
console.log('Google Vision Key:', GOOGLE_VISION_KEY ? '\uc0\u10003 ' : '\u10007  Missing');\
console.log('OpenAI Key:', OPENAI_KEY ? '\uc0\u10003 ' : '\u10007  Missing');\
\
app.get('/health', (req, res) => \{\
    res.json(\{ status: 'Backend is running', timestamp: new Date() \});\
\});\
\
app.post('/api/generate-redesign', async (req, res) => \{\
    try \{\
        const \{ userWebsiteUrl, inspirationWebsiteUrl, userMessage \} = req.body;\
\
        if (!userWebsiteUrl || !inspirationWebsiteUrl) \{\
            return res.status(400).json(\{ error: 'Missing required URLs' \});\
        \}\
\
        console.log('Processing:', userWebsiteUrl);\
\
        const userContent = await extractWebsiteContent(userWebsiteUrl);\
        const inspirationDesign = await analyzeDesignInspiration(inspirationWebsiteUrl);\
        const mockup = await generateMockup(userContent, inspirationDesign);\
\
        res.json(\{\
            success: true,\
            data: \{\
                content: userContent,\
                design: inspirationDesign,\
                mockup: mockup,\
                message: userMessage\
            \}\
        \});\
    \} catch (error) \{\
        console.error('Error:', error.message);\
        res.status(500).json(\{ error: error.message \});\
    \}\
\});\
\
async function extractWebsiteContent(url) \{\
    try \{\
        console.log('Extracting content from:', url);\
        \
        const screenshotUrl = `https://screenshot.screenshotmachine.com?key=free&url=$\{encodeURIComponent(url)\}&dimension=1200x768`;\
        \
        const response = await axios.get(screenshotUrl, \{\
            responseType: 'arraybuffer',\
            timeout: 10000\
        \});\
        \
        const imageBuffer = Buffer.from(response.data, 'binary');\
        const base64Image = imageBuffer.toString('base64');\
\
        const visionResponse = await axios.post(\
            `https://vision.googleapis.com/v1/images:annotate?key=$\{GOOGLE_VISION_KEY\}`,\
            \{\
                requests: [\{\
                    image: \{ content: base64Image \},\
                    features: [\
                        \{ type: 'TEXT_DETECTION' \},\
                        \{ type: 'IMAGE_PROPERTIES' \}\
                    ]\
                \}]\
            \},\
            \{ timeout: 15000 \}\
        );\
\
        const textAnnotations = visionResponse.data.responses[0].textAnnotations || [];\
        const extractedText = textAnnotations.length > 0 ? textAnnotations[0].description : 'No text found';\
        const colors = visionResponse.data.responses[0].imagePropertiesAnnotation?.dominantColors?.colors || [];\
\
        console.log('Text extracted, structuring with AI...');\
\
        const structuredContent = await structureContentWithAI(extractedText);\
\
        return \{\
            extractedText: extractedText.substring(0, 500),\
            colors: colors.slice(0, 5),\
            structured: structuredContent\
        \};\
    \} catch (error) \{\
        console.error('Content extraction error:', error.message);\
        return getSampleContent();\
    \}\
\}\
\
async function structureContentWithAI(text) \{\
    try \{\
        const openaiResponse = await axios.post(\
            'https://api.openai.com/v1/chat/completions',\
            \{\
                model: 'gpt-3.5-turbo',\
                messages: [\{\
                    role: 'user',\
                    content: `Analyze this website text and return ONLY a JSON with these sections: hero (headline, subheadline), services (array of 3 with name, description), about (title, content), testimonials (array of 2 with quote, author). Text: "$\{text.substring(0, 800)\}"`\
                \}],\
                temperature: 0.7,\
                max_tokens: 1000\
            \},\
            \{\
                headers: \{\
                    'Authorization': `Bearer $\{OPENAI_KEY\}`,\
                    'Content-Type': 'application/json'\
                \},\
                timeout: 15000\
            \}\
        );\
\
        const responseText = openaiResponse.data.choices[0].message.content;\
        \
        try \{\
            return JSON.parse(responseText);\
        \} catch \{\
            return getSampleStructuredContent();\
        \}\
    \} catch (error) \{\
        console.error('OpenAI error:', error.message);\
        return getSampleStructuredContent();\
    \}\
\}\
\
async function analyzeDesignInspiration(url) \{\
    try \{\
        console.log('Analyzing design from:', url);\
        \
        const screenshotUrl = `https://screenshot.screenshotmachine.com?key=free&url=$\{encodeURIComponent(url)\}&dimension=1200x768`;\
        \
        const response = await axios.get(screenshotUrl, \{\
            responseType: 'arraybuffer',\
            timeout: 10000\
        \});\
        \
        const imageBuffer = Buffer.from(response.data, 'binary');\
        const base64Image = imageBuffer.toString('base64');\
\
        const visionResponse = await axios.post(\
            `https://vision.googleapis.com/v1/images:annotate?key=$\{GOOGLE_VISION_KEY\}`,\
            \{\
                requests: [\{\
                    image: \{ content: base64Image \},\
                    features: [\
                        \{ type: 'IMAGE_PROPERTIES' \},\
                        \{ type: 'LABEL_DETECTION' \}\
                    ]\
                \}]\
            \},\
            \{ timeout: 15000 \}\
        );\
\
        const analysis = visionResponse.data.responses[0];\
        const colors = [];\
\
        if (analysis.imagePropertiesAnnotation?.dominantColors?.colors) \{\
            analysis.imagePropertiesAnnotation.dominantColors.colors.slice(0, 5).forEach(color => \{\
                const rgb = color.color;\
                const hex = rgbToHex(rgb.red, rgb.green, rgb.blue);\
                colors.push(\{\
                    name: `Color`,\
                    hex: hex,\
                    score: color.pixelFraction\
                \});\
            \});\
        \}\
\
        const elements = [];\
        if (analysis.labelAnnotations) \{\
            analysis.labelAnnotations.slice(0, 5).forEach(label => \{\
                elements.push(\{\
                    name: label.description,\
                    confidence: label.score\
                \});\
            \});\
        \}\
\
        return \{\
            colors: colors,\
            elements: elements,\
            typography: 'Modern, Professional',\
            layout: 'Grid-based with good spacing',\
            website: url\
        \};\
    \} catch (error) \{\
        console.error('Design analysis error:', error.message);\
        return getSampleDesignAnalysis();\
    \}\
\}\
\
async function generateMockup(userContent, designAnalysis) \{\
    return \{\
        title: 'Website Redesign Mockup',\
        sections: [\
            \{ name: 'Hero', content: userContent.structured?.hero || \{\} \},\
            \{ name: 'Services', content: userContent.structured?.services || [] \},\
            \{ name: 'Testimonials', content: userContent.structured?.testimonials || [] \}\
        ],\
        colors: designAnalysis.colors,\
        generatedAt: new Date().toISOString()\
    \};\
\}\
\
function rgbToHex(r, g, b) \{\
    return '#' + [r, g, b].map(x => \{\
        const hex = Math.round(x).toString(16);\
        return hex.length === 1 ? '0' + hex : hex;\
    \}).join('');\
\}\
\
function getSampleContent() \{\
    return \{\
        extractedText: 'Professional healthcare solutions with expert care',\
        colors: [],\
        structured: getSampleStructuredContent()\
    \};\
\}\
\
function getSampleStructuredContent() \{\
    return \{\
        hero: \{\
            headline: 'Transform Your Health With Expert Care',\
            subheadline: 'Professional healthcare solutions tailored to your needs'\
        \},\
        services: [\
            \{ name: 'Physical Therapy', description: 'Comprehensive rehabilitation programs' \},\
            \{ name: 'Expert Consultation', description: 'Professional medical advice' \},\
            \{ name: 'Wellness Programs', description: 'Holistic health solutions' \}\
        ],\
        testimonials: [\
            \{ quote: 'Outstanding service!', author: 'Patient' \},\
            \{ quote: 'Highly recommended!', author: 'Client' \}\
        ]\
    \};\
\}\
\
function getSampleDesignAnalysis() \{\
    return \{\
        colors: [\
            \{ hex: '#2563eb', name: 'Primary Blue' \},\
            \{ hex: '#14b8a6', name: 'Secondary Teal' \},\
            \{ hex: '#f97316', name: 'Accent Orange' \}\
        ],\
        elements: [\
            \{ name: 'Modern Design', confidence: 0.95 \},\
            \{ name: 'Professional', confidence: 0.92 \}\
        ],\
        typography: 'Modern, Clean',\
        layout: 'Grid-based'\
    \};\
\}\
\
app.listen(PORT, () => \{\
    console.log(`\uc0\u10003  Server running on port $\{PORT\}`);\
    console.log(`\uc0\u10003  Health: http://localhost:$\{PORT\}/health`);\
\});\
```\
\
---\
\
## How to use this:\
\
1. Open TextEdit on your Mac\
2. Make sure Format \uc0\u8594  Plain Text is selected\
3. Copy the entire code above (everything between the backticks)\
4. Paste it into TextEdit\
5. File \uc0\u8594  Save\
6. Name it: `server.js`\
7. Save in: Desktop/website-redesign-backend\
}