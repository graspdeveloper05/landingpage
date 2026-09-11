<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * §6 and §15 — the photograph behind the hero, replaceable from the panel.
 *
 * Four files come out of one upload, because the hero is the largest image on
 * the site and §11 expects most visitors to arrive on a phone:
 *
 *   {id}.webp      {id}.jpg        up to 2400 wide, for desktop
 *   {id}-960.webp  {id}-960.jpg    for phones
 *
 * That matches what the Picture component asks for from a single base path,
 * so nothing downstream has to know whether an image was shipped with the
 * build or uploaded afterwards.
 *
 * Resizing is done here rather than asked of the organising team. Told to
 * supply four files at two sizes in two formats, anybody would reasonably
 * upload one 8 MB photograph straight off a camera and the hero would take
 * several seconds to appear on a phone.
 */
class HeroImageController extends Controller
{
    /** The widest we serve. Beyond this is bytes nobody sees. */
    private const WIDE = 2400;

    /** The phone variant, matching the shipped hero-scene-960. */
    private const NARROW = 960;

    public function store(Request $request): JsonResponse
    {
        // Checked before validation so the failure names the real problem.
        // Without it a missing extension surfaces as "the image failed to
        // process", and somebody spends an afternoon re-exporting a photo
        // that was never the issue.
        if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
            return response()->json([
                'message' => 'This server cannot process images. Ask the host to enable the PHP GD extension with WebP support.',
            ], 503);
        }

        $request->validate([
            'hero' => [
                'required',
                'image',
                // mimes: on an upload checks the real type, not the filename.
                // svg is excluded: it is a document that can carry script,
                // and this is served from the site's own origin.
                'mimes:jpeg,jpg,png,webp',
                'max:12288',
                /*
                 * The hero is displayed full-bleed across a desktop window.
                 * Anything under 1600 wide is upscaled by the browser and
                 * looks soft on exactly the image the whole page rests on.
                 */
                'dimensions:min_width=1600,min_height=600',
            ],
        ], [
            'hero.dimensions' => 'The image must be at least 1600 × 600. Around 2400 × 1000 works best.',
            'hero.max' => 'The image must be under 12 MB.',
            'hero.mimes' => 'Use a JPEG, PNG or WebP image.',
            'hero.required' => 'Choose an image to upload.',
        ]);

        $source = @imagecreatefromstring(
            (string) file_get_contents($request->file('hero')->getRealPath()),
        );

        // Reached when the file passed validation but GD still cannot decode
        // it -- a truncated download, or a format this build was not compiled
        // with. Better than a fatal error inside the resize below.
        if ($source === false) {
            return response()->json([
                'message' => 'That image could not be read. Try exporting it again as a JPEG.',
            ], 422);
        }

        // The id is generated, never taken from the upload: a supplied
        // filename can carry path separators or a second extension, and it
        // leaks whatever the organiser called the file on their laptop.
        $id = Str::uuid()->toString();

        try {
            $this->write($source, $id, self::WIDE);
            $this->write($source, $id, self::NARROW, '-960');
        } finally {
            imagedestroy($source);
        }

        return response()->json([
            // Without extension. Picture appends .webp and .jpg, and looks
            // for the -960 pair beside them.
            'path' => '/storage/hero/'.$id,
        ], 201);
    }

    /** One width, written as both WebP and JPEG. */
    private function write(\GdImage $source, string $id, int $width, string $suffix = ''): void
    {
        $srcW = imagesx($source);
        $srcH = imagesy($source);

        // Never enlarged. Upscaling a 1600px photo to 2400 adds file size and
        // no detail, and the result is softer than the original would be.
        $targetW = min($width, $srcW);
        $targetH = (int) round($srcH * ($targetW / $srcW));

        $canvas = imagecreatetruecolor($targetW, $targetH);

        // A PNG with transparency would otherwise composite onto black. The
        // hero sits on the cream page ground, so that is what fills it.
        $cream = imagecolorallocate($canvas, 252, 252, 251);
        imagefilledrectangle($canvas, 0, 0, $targetW, $targetH, $cream);

        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetW, $targetH, $srcW, $srcH);

        $base = 'hero/'.$id.$suffix;

        // Written through the storage disk rather than to a path, so this
        // works the same whether the disk is local or somewhere else later.
        Storage::disk('public')->put($base.'.webp', $this->encode($canvas, 'webp'));
        Storage::disk('public')->put($base.'.jpg', $this->encode($canvas, 'jpeg'));

        imagedestroy($canvas);
    }

    /** GD writes to a stream, so the output is captured into a string. */
    private function encode(\GdImage $image, string $format): string
    {
        ob_start();

        if ($format === 'webp') {
            // 82 is where WebP stops being visibly lossy on photographs while
            // still roughly halving a JPEG of the same quality.
            imagewebp($image, null, 82);
        } else {
            imagejpeg($image, null, 86);
        }

        return (string) ob_get_clean();
    }
}
